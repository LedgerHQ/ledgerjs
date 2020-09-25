import {
  listFiatCurrencies,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
} from "./fiats";
import { listTokens, findTokenById } from "./tokens";
import {
  listCryptoCurrencies,
  hasCryptoCurrencyId,
  getCryptoCurrencyById,
} from "./currencies";

test("can get currency by coin type", () => {
  expect(getCryptoCurrencyById("bitcoin")).toMatchObject({
    id: "bitcoin",
    name: "Bitcoin",
  });
  expect(getCryptoCurrencyById("litecoin")).toMatchObject({
    id: "litecoin",
    name: "Litecoin",
  });
  expect(hasCryptoCurrencyId("bitcoin")).toBe(true);
  expect(hasCryptoCurrencyId("")).toBe(false);
  expect(() => getCryptoCurrencyById("")).toThrow();
  expect(hasCryptoCurrencyId("_")).toBe(false);
  expect(() => getCryptoCurrencyById("_")).toThrow();
});

test("there are some dev cryptocurrencies", () => {
  const all = listCryptoCurrencies(true);
  const prod = listCryptoCurrencies();
  expect(listCryptoCurrencies(false)).toBe(listCryptoCurrencies());
  expect(all).not.toBe(prod);
  expect(all.filter((a) => !a.isTestnetFor)).toMatchObject(prod);
  expect(all.length).toBeGreaterThan(prod.length);
});

test("all cryptocurrencies match (by reference) the one you get by id", () => {
  for (let c of listCryptoCurrencies()) {
    expect(c).toBe(getCryptoCurrencyById(c.id));
  }
});

test("there is no testnet or terminated coin by default", () => {
  for (let c of listCryptoCurrencies()) {
    expect(!c.terminated).toBe(true);
    expect(!c.isTestnetFor).toBe(true);
  }
});

test("all cryptocurrencies have at least one unit", () => {
  for (let c of listCryptoCurrencies()) {
    expect(c.units.length).toBeGreaterThan(0);
  }
});

test("fiats list is always the same", () => {
  expect(listFiatCurrencies()).toEqual(listFiatCurrencies());
});

test("fiats list elements are correct", () => {
  const tickers = {};
  for (const fiat of listFiatCurrencies()) {
    expect(fiat.ticker).toBeTruthy();
    expect(typeof fiat.ticker).toBe("string");
    expect(tickers[fiat.ticker]).toBeFalsy();
    expect(fiat.units.length).toBeGreaterThan(0);
    const unit = fiat.units[0];
    expect(unit.code).toBeTruthy();
    expect(typeof unit.code).toBe("string");
    expect(unit.name).toBeTruthy();
    expect(typeof unit.name).toBe("string");
    expect(unit.magnitude).toBeGreaterThan(-1);
    expect(typeof unit.magnitude).toBe("number");
    tickers[fiat.ticker] = unit;
  }
});

test("tokens are correct", () => {
  expect(listTokens().length).toBeGreaterThan(0);
  for (const token of listTokens()) {
    expect(token.ticker).toBeTruthy();
    expect(typeof token.id).toBe("string");
    expect(typeof token.name).toBe("string");
    if (token.ledgerSignature) {
      expect(typeof token.ledgerSignature).toBe("string");
    }
    expect(typeof token.tokenType).toBe("string");
    expect(typeof token.parentCurrency).toBe("object");
    expect(hasCryptoCurrencyId(token.parentCurrency.id)).toBe(true);
    expect(typeof token.ticker).toBe("string");
    expect(token.units.length).toBeGreaterThan(0);
    const unit = token.units[0];
    expect(unit.code).toBeTruthy();
    expect(typeof unit.code).toBe("string");
    expect(unit.name).toBeTruthy();
    expect(typeof unit.name).toBe("string");
    expect(unit.magnitude).toBeGreaterThan(-1);
    expect(typeof unit.magnitude).toBe("number");
    if (token.compoundFor) {
      const t = findTokenById(token.compoundFor);
      expect(typeof t).toBe("object");
    }
  }
});

test("fiats list is sorted by ticker", () => {
  expect(
    listFiatCurrencies()
      .map((fiat) => fiat.ticker)
      .join(",")
  ).toEqual(
    listFiatCurrencies()
      .map((fiat) => fiat.ticker)
      .sort((a, b) => (a > b ? 1 : -1))
      .join(",")
  );
});

test("can get fiat by coin type", () => {
  expect(getFiatCurrencyByTicker("USD").units[0]).toMatchObject({
    magnitude: 2,
  });
  expect(getFiatCurrencyByTicker("EUR").units[0]).toMatchObject({
    magnitude: 2,
  });
  // this is not a fiat \o/
  expect(() => getFiatCurrencyByTicker("USDT").units[0]).toThrow();
  expect(hasFiatCurrencyTicker("USD")).toBe(true);
  expect(hasFiatCurrencyTicker("USDT")).toBe(false);
});
