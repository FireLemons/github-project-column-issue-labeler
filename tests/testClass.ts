module.exports = class TestClass {
  arg2: any
  arg3: any
  jsonArg: any

  constructor(jsonArg: any, arg2: any, arg3: any) {
    this.jsonArg = jsonArg
    this.arg2 = arg2;
    this.arg3 = arg3;
  }
}