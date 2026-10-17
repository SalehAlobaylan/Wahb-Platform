import { randomUUID } from "node:crypto";
import { ConsumptionOwner } from "../consumption-owner";
beforeAll(() => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: randomUUID,
  });
});
it("shares one cumulative segment across feed and global ownership and flushes abandoned listening", () => {
  const owner = new ConsumptionOwner();
  const emit = jest.fn();
  owner.observe("content", "account", "pods", 0, 300, true, emit, 0);
  owner.observe("content", "account", "pods", 20, 300, true, emit, 20000);
  owner.release("pods");
  owner.observe("content", "account", "global", 20, 300, true, emit, 21000);
  owner.observe("content", "account", "global", 40, 300, true, emit, 41000);
  owner.release("global");
  expect(emit.mock.calls.at(-1)?.[1].played).toBe(40);
  expect(
    new Set(emit.mock.calls.map((c) => c[2].economics_segment_id)).size,
  ).toBe(1);
});
it("does not merge public listening into an account or a replay into the previous run", () => {
  const owner = new ConsumptionOwner();
  const emit = jest.fn();
  owner.observe("content", "public", "pods", 0, 300, true, emit, 0);
  owner.observe("content", "public", "pods", 10, 300, true, emit, 10000);
  owner.clearIdentity("account");
  owner.observe("content", "account", "pods", 10, 300, true, emit, 11000);
  owner.observe("content", "account", "pods", 20, 300, true, emit, 21000);
  owner.release("pods");
  expect(emit.mock.calls.at(-1)?.[1].played).toBe(10);
  const first = emit.mock.calls.at(-1)?.[2].economics_segment_id;
  owner.replay("pods");
  owner.observe("content", "account", "pods", 0, 300, true, emit, 22000);
  owner.observe("content", "account", "pods", 5, 300, true, emit, 27000);
  owner.release("pods");
  expect(emit.mock.calls.at(-1)?.[2].economics_segment_id).not.toBe(first);
});
