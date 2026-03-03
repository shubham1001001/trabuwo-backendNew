class Result {
  static success(data, message = null) {
    return {
      success: true,
      data,
      message,
    };
  }

  static failure(error) {
    return {
      success: false,
      error,
    };
  }

  static isSuccess(result) {
    return result.success === true;
  }

  static isFailure(result) {
    return result.success === false;
  }
}

module.exports = Result;
