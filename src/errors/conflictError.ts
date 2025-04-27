export class ConflictError extends Error {
  constructor (message?: string, options?: ErrorOptions) {
    super(message, options)
  }
}
