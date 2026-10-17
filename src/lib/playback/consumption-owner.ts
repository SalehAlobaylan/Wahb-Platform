import {
  ConsumptionTracker,
  type ConsumptionEvent,
} from "./consumption-tracker";

type Owner = "pods" | "global";
type Emit = (
  contentId: string,
  event: ConsumptionEvent,
  metadata: Record<string, unknown>,
) => void;
type Session = {
  contentId: string;
  identity: string;
  segment: string;
  tracker: ConsumptionTracker;
  duration: number;
  owner: Owner;
  emit: Emit;
};

/** A single audible session survives route/source handoffs. No per-account map. */
export class ConsumptionOwner {
  private active: Session | null = null;
  observe(
    contentId: string,
    identity: string,
    owner: Owner,
    position: number,
    duration: number,
    playing: boolean,
    emit: Emit,
    at = Date.now(),
    rate = 1,
    ended = false,
  ) {
    if (this.active?.identity !== identity) this.active = null;
    if (this.active && this.active.contentId !== contentId) {
      this.flush();
      this.active = null;
    }
    if (!this.active)
      this.active = {
        contentId,
        identity,
        owner,
        segment: crypto.randomUUID(),
        tracker: new ConsumptionTracker(position),
        duration,
        emit,
      };
    const current = this.active;
    if (current.owner !== owner) {
      current.tracker.seek(position);
      current.owner = owner;
    }
    current.duration = duration;
    current.emit = emit;
    current.tracker.observe(position, playing, at, rate);
    this.flush(!playing, ended);
  }
  boundary(owner: Owner) {
    if (this.active?.owner === owner) this.active.tracker.boundary();
  }
  flush(terminal = true, ended = false) {
    const current = this.active;
    if (!current) return;
    const event = current.tracker.event(current.duration, terminal, ended);
    if (event)
      current.emit(current.contentId, event, {
        surface: "pods",
        consumption_contract_version: 1,
        ...(event.type !== 'progress' ? { consumption_classification: event.type === 'complete' ? 'completed' : event.type } : {}),
        position_seconds: current.tracker.state.lastObservedPositionSeconds,
        actual_played_seconds: event.played,
        furthest_position_seconds: event.furthest,
        economics_version: 1,
        economics_client: "web_completion",
        economics_segment_id: current.segment,
        economics_observed_at: new Date().toISOString(),
        economics_observation: "media_position_seconds_v1",
      });
  }
  release(owner: Owner, ended = false) {
    if (this.active?.owner !== owner) return;
    this.flush(true, ended);
    this.boundary(owner);
  }
  replay(owner: Owner) {
    if (this.active?.owner === owner) {
      this.flush();
      this.active = null;
    }
  }
  clearIdentity(identity: string) {
    if (this.active?.identity !== identity) this.active = null;
  }
}
export const webConsumption = new ConsumptionOwner();
