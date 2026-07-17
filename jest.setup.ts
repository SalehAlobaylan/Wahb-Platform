
import '@testing-library/jest-dom';

// Mock HTMLMediaElement properties and methods that JSDOM doesn't implement
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: jest.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: jest.fn(),
});

// Mandatory tests never use a configured CMS/IAM/media endpoint or public
// network. Contract tests install an explicit local fake; an unconfigured
// request fails before Node could attempt a connection.
global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const raw = input instanceof Request ? input.url : input.toString();
    const url = new URL(raw, 'http://localhost');
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1' && url.hostname !== '::1') {
        throw new Error(`test network policy rejected non-loopback origin: ${url.origin}`);
    }
    throw new Error(`test fetch requires an explicit local fake: ${url.pathname}`);
});

// Mock HTMLVideoElement specifically just in case
Object.defineProperty(window.HTMLVideoElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockImplementation(() => Promise.resolve()),
});
