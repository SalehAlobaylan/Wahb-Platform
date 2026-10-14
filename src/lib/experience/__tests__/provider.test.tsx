import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { ExperienceProvider } from '@/components/experience-provider';
import { reportClientFailure } from '../journeys';
jest.mock('next/navigation', () => ({ usePathname: () => '/app' }));
jest.mock('../collector', () => ({ emitEvent: jest.fn(), initCollector: jest.fn() }));
jest.mock('../journeys', () => ({ reportClientFailure: jest.fn() }));

it('reattaches sanitized global error observers after Strict Mode cleanup', () => {
  window.history.replaceState({}, '', '/app');
  const view = render(<StrictMode><ExperienceProvider /></StrictMode>);
  window.dispatchEvent(new Event('error'));
  expect(reportClientFailure).toHaveBeenCalledTimes(1);
  expect(reportClientFailure).toHaveBeenCalledWith('pods', 'unknown');
  view.unmount();
  window.dispatchEvent(new Event('error'));
  expect(reportClientFailure).toHaveBeenCalledTimes(1);
});
