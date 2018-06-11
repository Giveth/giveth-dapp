export class Person {
  constructor(name) {
    this.name = name;
  }

  test() {
    return true;
  }

  sayHi() {
    return `Hi ${this.name}`;
  }
}

export class OtherPerson extends Person {
  constructor() {
    super('David');
  }

  sayHi() {
    return `${super.sayHi()} Luecke`;
  }
}
