// Global test setup
beforeEach(() => {
  // Reset console.log/error to avoid test output clutter
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});