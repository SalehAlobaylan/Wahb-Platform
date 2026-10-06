import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/lib/test-utils';
import { AudioPlayerControls } from '../audio-player-controls';

const props = { position: 40, duration: 298, playing: false, buffering: false, disabled: false, rate: 1,
    onToggle: jest.fn(), onSeek: jest.fn(), onRate: jest.fn() };

beforeEach(() => jest.clearAllMocks());

it('scrubs locally and seeks once on release without toggling playback', () => {
    renderWithProviders(<AudioPlayerControls {...props} />);
    const slider = screen.getByRole('slider', { name: 'Playback position' });
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: 125 } });
    fireEvent.change(slider, { target: { value: 130 } });
    expect(props.onSeek).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute('aria-valuetext', '2:10 / 4:58');
    fireEvent.pointerUp(slider);
    expect(props.onSeek).toHaveBeenCalledTimes(1);
    expect(props.onSeek).toHaveBeenCalledWith(130);
    expect(props.onToggle).not.toHaveBeenCalled();
});

it('supports keyboard/assistive changes, explicit skips and speed', () => {
    renderWithProviders(<AudioPlayerControls {...props} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: 120 } });
    expect(props.onSeek).toHaveBeenLastCalledWith(120);
    fireEvent.click(screen.getByRole('button', { name: 'Skip back 15 seconds' }));
    expect(props.onSeek).toHaveBeenLastCalledWith(25);
    fireEvent.click(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));
    expect(props.onSeek).toHaveBeenLastCalledWith(55);
    fireEvent.click(screen.getByRole('button', { name: 'Playback speed 1×. Tap to change speed' }));
    expect(props.onRate).toHaveBeenCalledTimes(1);
});

it('keeps play available with unknown duration and cancels unfinished scrubs', () => {
    const view = renderWithProviders(<AudioPlayerControls {...props} duration={0} />);
    expect(screen.getByRole('slider')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
    view.rerender(<AudioPlayerControls {...props} />);
    const slider = screen.getByRole('slider');
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: 125 } });
    fireEvent.pointerCancel(slider);
    fireEvent.pointerUp(slider);
    expect(props.onSeek).not.toHaveBeenCalled();
});
