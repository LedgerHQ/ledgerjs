import { expect } from "chai";

import { getAda } from "../utils";

describe("testBase58Encode", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should successfully base58 encode a valid address (124 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a20058208200581c240596b9b63fc010c06fbe92cf6f820587406534795958c411e662dc014443c0688e001a6768cc8682d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a2005820";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("33gGrwBKYTVq1NCtdFuoa3NGHM557m1D4XgDx9tE7bHYKnWLdUPzx4vLqz5HJo1fFZyxSE6TMjEaEz1f2zn5iB456DfBMQxHCgzdkc8wjMRw4xWYeA9HeHvx7pHhJYC7eShgGaScKzhAaWMbHGc2FsgAW9VQUEXqFE16FtmVcs");
    expect(response.addressLength).to.equal(170);
  });

  it("Should reject address between 124 and 248 bytes (200 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a20058208200581c240596b9b63fc010c06fbe92cf6f820587406534795958c411e662dc014443c0688e001a6768cc8682d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a200582014443c0688e001a67ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f89aec0d4374b7d3e18609ede8589f82f7f0a200582006fbe92cf6f820587406534795958c411e662dc0f";

    try {
      const response = await ada.testBase58Encode(address);
      throw new Error("Expected error");
    } catch(error) {
      expect(error.message).to.have.string("5801");
    }
  });

  it("Should successfully base58 encode a valid address (84 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a20058208200581c240596b9b63fc010c06fbe92cf6f820587406534795958c411e662dc014443c0688e001a6768cc86";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("AL91N9VXRTCypFouG2KjJvJuvKmUC4p3XcpHnYETWRG5HJVpi2ixeN1nG5EWtbJCH71YjzhqHKcsmmPYGRjy8nHDe2i17BEf9hTqDDLmcFVbHxx1GW9");
    expect(response.addressLength).to.equal(115);
  });

  it("Should successfully base58 encode a valid address (48 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a20058208200581c240596b9";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("5oP9ibJgeUpYTNH63zMtZpGW9HvKqmivuW9LZ8rjwFYmyRc5ck1XPuRLUPmGfmqmyS");
    expect(response.addressLength).to.equal(66);
  });

  it("Should successfully base58 encode a valid address (43 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a2005820820058";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("Ae2tdQQF3CnPrUGo38JavTvDTzJs1Y9G65U4dSETMDUdr1rhXGDyu8hrhKV");
    expect(response.addressLength).to.equal(59);
  });

  it("Should successfully base58 encode a valid address (27 bytes)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e1";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("JggfeJYzKnHo6CUKakUwBpbkZYkRGcuf72szg");
    expect(response.addressLength).to.equal(37);
  });

  it("Should successfully base58 encode an all 0 address", async () => {
    const address = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("111111111111111111111111111111111111111111111111111111111111111111111111111111111111");
    expect(response.addressLength).to.equal(84);
  });

  it("Should successfully base58 encode an all f address", async () => {
    const address = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const response = await ada.testBase58Encode(address);

    expect(response.encodedAddress).to.equal("KFkZCd6ceBYVN8e8bNgC31W2UoK3odH6K184U8cap3ybmSAs536NFvWdhYcoSjANHiEJptMGjRmUds6rAKYs5Rnii2Y9NeDmTRa6wrKATG9BvH1eJxW");
    expect(response.addressLength).to.equal(115);
  });

  it("Should successfully return empty for empty string", async () => {
    const response = await ada.testBase58Encode("");

    expect(response.encodedAddress).to.equal("");
    expect(response.addressLength).to.equal(0);
  });

  it("Should reject a blank input", async () => {
    try {
      const response = await ada.testBase58Encode();
      throw new Error("Expected error");
    } catch (error) {
      // We're cool
    }
  });

  it("Should reject 1024 + 1 byte input (APDU max size)", async () => {
    const address = "839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a00a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a";

    try {
      const response = await ada.testBase58Encode(address);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("data.length exceed");
    }
  });

  it("Should reject invalid hexadecimal characters", async () => {
    const address = "abcdefg";

    try {
      const response = await ada.testBase58Encode(address);
      throw new Error("Expected error");
    } catch (error) {
      // We're cool
    }
  });

  it("Should reject invalid length hexadecimal", async () => {
    const address = "82d81";

    try {
      const response = await ada.testBase58Encode(address);
      throw new Error("Expected error");
    } catch (error) {
      // We're cool
    }
  });

  it("Should base58 encode with 20 iterations (stress test)", async () => {
    const address = "82d818584a83581ce7fe8e468d2249f18cd7bf9aec0d4374b7d3e18609ede8589f82f7f0a20058208200581c240596b9b63fc010c06fbe92cf6f820587406534795958c411e662dc014443c0688e001a6768cc86";
    
    for (let i = 0; i < 20; i++) {
      const response = await ada.testBase58Encode(address);
      expect(response.encodedAddress).to.equal("AL91N9VXRTCypFouG2KjJvJuvKmUC4p3XcpHnYETWRG5HJVpi2ixeN1nG5EWtbJCH71YjzhqHKcsmmPYGRjy8nHDe2i17BEf9hTqDDLmcFVbHxx1GW9");
      expect(response.addressLength).to.equal(115);
    }
  });
});
