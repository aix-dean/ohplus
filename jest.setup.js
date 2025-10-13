import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Mock Response constructor
global.Response = jest.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock window.open
global.window.open = jest.fn()

// Mock File constructor
global.File = jest.fn()
