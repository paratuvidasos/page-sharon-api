import { InvalidMoneyAmountException } from "../exceptions/InvalidMoneyAmountException";

export class Money {
  private constructor(private readonly value: number) {}

  static of(amount: number): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new InvalidMoneyAmountException(amount);
    }
    return new Money(Math.round(amount * 100) / 100);
  }

  get amount(): number {
    return this.value;
  }
}
