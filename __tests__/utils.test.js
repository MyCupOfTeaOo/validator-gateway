require("jest");

const testData = [
  {
    path: "POST /general/cnt",
    rules: {
      cntCode: [
        {
          required: true,
          message: "合同编码必填"
        }
      ],
      buyerName: [
        {
          required: true,
          message: "买方名称必填"
        }
      ]
    }
  },
  {
    path: "PUT /general/cnt",
    rules: {
      cntCode: [
        {
          required: true,
          message: "合同编码必填"
        }
      ],
      buyerName: [
        {
          required: true,
          message: "买方名称必填"
        }
      ]
    }
  }
];

const { getHandlePath, checkData } = require("../utils");

const handlerSchemas = [];
for (const api of testData) {
  const handlerData = getHandlePath(api.path, api.rules);
  handlerSchemas.push(handlerData);
}

describe("测试checkData", () => {
  it("放过的uri", async () => {
    const t = await checkData(
      {
        url: "/general/cntt",
        method: "POST",
        read: () => {}
      },
      handlerSchemas
    );

    expect(t).toBe();
  });
  it("正确的内容", async () => {
    const t = await checkData(
      {
        url: "/general/cnt",
        method: "POST",
        read: () => `{"cntCode": 1,"buyerName":1}`
      },
      handlerSchemas
    );

    expect(t).toBe();
  });
  it("解析body出错", async () => {
    const t = await checkData(
      {
        url: "/general/cnt",
        method: "POST",
        read: () => ``
      },
      handlerSchemas
    );

    expect(t).toBe("解析body出错");
  });
  it("合同编码必填", async () => {
    const t = await checkData(
      {
        url: "/general/cnt",
        method: "POST",
        read: () => `{}`
      },
      handlerSchemas
    );

    expect(t).toBe("合同编码必填");
  });
});
