/**
 * Error basic common interface
 */
class ErrorModel extends Error {
  constructor({ message = '', name = '', status = '' }) {
    super(message);

    this.name = name;
    this.status = status;
  }

  get status() {
    return this.status;
  }

  set status(value) {
    this.status = value;
  }
}

export default ErrorModel;
