//@flow
import React, { Component } from "react";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalsQuery, AnimalQuery } from "../tests-utils/mock-1";

test("the mock-1 and utility functions works", () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const inst = renderer.create(render(<div />));
  expect(inst.toJSON()).toEqual(renderer.create(render(<div />)).toJSON());
  expect(net.countTickWaiters()).toBe(0);
  expect(net.tick()).toBe(0);
  inst.unmount();
});

test("connectData can be used without data, render in sync and receives a restlay prop object", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Root = connectData(({ restlay }) => typeof restlay);
  const inst = renderer.create(render(<Root />));
  expect(inst.toJSON()).toBe("object");
  inst.unmount();
});

test("a simple query works", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  class AnimalsR extends Component<*> {
    render() {
      const { animals } = this.props;
      return (
        <div>
          {animals.map(a => <div key={a.id}>{a.name + ": " + a.age}</div>)}
        </div>
      );
    }
  }
  const Animals = connectData(AnimalsR, {
    queries: {
      animals: AnimalsQuery
    }
  });
  const inst = renderer.create(render(<Animals />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(net.countTickWaiters()).toBe(0);
  expect(inst.toJSON()).toEqual(
    renderer
      .create(
        render(
          <div>
            <div>max: 14</div>
            <div>doge: 5</div>
          </div>
        )
      )
      .toJSON()
  );
  inst.unmount();
});

test("query with props works", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  class AnimalR extends Component<*> {
    render() {
      const { a } = this.props;
      return <div key={a.id}>{a.name + ": " + a.age}</div>;
    }
  }
  const Animal = connectData(AnimalR, {
    queries: {
      a: AnimalQuery
    },
    propsToQueryParams: ({ id_prop }) => ({ animalId: id_prop })
  });
  const inst = renderer.create(render(<Animal id_prop="id_max" />));
  expect(inst.toJSON()).toEqual(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(net.countTickWaiters()).toBe(0);
  expect(inst.toJSON()).toEqual(
    renderer.create(render(<div>max: 14</div>)).toJSON()
  );
  inst.update(render(<Animal id_prop="id_doge" />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(net.countTickWaiters()).toBe(0);
  expect(inst.toJSON()).toEqual(
    renderer.create(render(<div>doge: 5</div>)).toJSON()
  );
  inst.unmount();
});
