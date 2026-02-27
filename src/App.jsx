import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 產品資料結構
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null);

  // 頁面初始化
  useEffect(() => {
    // 取得token
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("loginToken="))
      ?.split("=")[1];

    // 建立 初始化 model
    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    // 如果沒有 token，直接結束
    if (!token) {
      setIsAuth(false);
      return;
    }
    // 設定 axios header
    axios.defaults.headers.common.Authorization = token;
    // 驗證身分
    const checkAdmin = async () => {
      try {
        // 驗證 token
        const res = await axios.post(`${API_BASE}/api/user/check`);
        console.log("Token 驗證成功：", res.data);
        setIsAuth(true);
        getProducts();
      } catch (error) {
        console.log("Token 驗證失敗：", error.response?.data);
        setIsAuth(false);
      }
    };

    checkAdmin();
  }, []);

  // 表單資料內容處理， 更新setFormData
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // 表單提交，向 API 發送登入請求並處理登入結果
  const handleSubmit = async (e) => {
    // 停用預設事件
    e.preventDefault();

    try {
      // 做連線
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      // 設定 cookie
      const { token, expired } = response.data;
      document.cookie = `loginToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common.Authorization = token;
      // 登入成功
      setIsAuth(true);
      // 取得產品資料
      getProducts();
    } catch (error) {
      // 登入失敗
      setIsAuth(false);
      console.log("登入失敗：", error.response?.data);
    }
  };

  // 獲取產品列表資料
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products`,
      );
      setProducts(response.data.products);
    } catch (error) {
      console.log("取得資料失敗：", error.response?.data);
    }
  };

  // 使用 ref 控制開啟 Modal
  const openModal = (product, type) => {
    // 資料設定
    setTemplateProduct((prevData) => ({
      ...prevData,
      ...product,
    }));
    setModalType(type);
    // modal 顯示
    productModalRef.current.show();
  };

  // 使用 ref 控制關閉 Modal
  const closeModal = () => {
    productModalRef.current.hide();
  };

  // modal 資料內容處理， 更新 setTemplateProduct
  const handleModalInputChange = (e) => {
    const { id, value, checked, type } = e.target;
    setTemplateProduct((prevData) => ({
      ...prevData,
      [id]: type === "checkbox" ? checked : value,
    }));
  };
  // modal 資料內的圖片處理
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((prevData) => {
      const newImage = [...prevData.imagesUrl];
      newImage[index] = value;
      return {
        ...prevData,
        imagesUrl: newImage,
      };
    });
  };

  // modal 新增圖片
  const handleAddImage = () => {
    setTemplateProduct((prevData) => {
      const newImage = [...prevData.imagesUrl];
      newImage.push("");
      return {
        ...prevData,
        imagesUrl: newImage,
      };
    });
  };

  // modal 移除圖片
  const handleRemoveImage = () => {
    setTemplateProduct((prevData) => {
      const newImage = [...prevData.imagesUrl];
      newImage.pop("");
      return {
        ...prevData,
        imagesUrl: newImage,
      };
    });
  };

  // 新增+更新產品資料
  const updateProduct = async (id) => {
    // 新增產品 url
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";
    // 編輯指定產品 url
    if (modalType == "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }
    // 產品資料
    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")],
      },
    };
    // 建立api連線
    try {
      const response = await axios[method](url, productData);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  // 刪除產品
  const delProduct = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/product/${id}`,
      );
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  return (
    <>
      {isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => openModal(INITIAL_TEMPLATE_DATA, "create")}
              >
                建立新的產品
              </button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.category}</td>
                    <td>{product.title}</td>
                    <td className="text-end">{product.origin_price}</td>
                    <td className="text-end">{product.price}</td>
                    <td>
                      <span
                        className={product.is_enabled ? "text-success" : ""}
                      >
                        {product.is_enabled ? "啟用" : "未啟用"}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openModal(product, "edit")}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openModal(product, "delete")}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>
                <button
                  className="btn btn-lg btn-primary w-100 mt-3"
                  type="submit"
                >
                  登入
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div
              className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}
            >
              <h5 id="productModalLabel" className="modal-title">
                <span>
                  {modalType === "delete"
                    ? "刪除"
                    : modalType === "edit"
                      ? "編輯"
                      : "新增"}
                  產品
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="fs-4">
                  確定要刪除
                  <span className="text-danger">{templateProduct.title}</span>
                  嗎？
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      {templateProduct.imagesUrl.map((url, index) => (
                        <div className="mb-3" key="{index}">
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            id="imageUrl"
                            type="text"
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={url}
                            onChange={(e) =>
                              handleModalImageChange(index, e.target.value)
                            }
                          />

                          {url && (
                            <img className="img-fluid" src={url} alt="" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <button
                        className="btn btn-outline-primary btn-sm d-block w-100"
                        onClick={handleAddImage}
                      >
                        新增圖片
                      </button>
                    </div>
                    <div>
                      <button
                        className="btn btn-outline-danger btn-sm d-block w-100"
                        onClick={handleRemoveImage}
                      >
                        刪除圖片
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        標題
                      </label>
                      <input
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={handleModalInputChange}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">
                          分類
                        </label>
                        <input
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">
                          單位
                        </label>
                        <input
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        產品描述
                      </label>
                      <textarea
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        說明內容
                      </label>
                      <textarea
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={handleModalInputChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                onClick={() => closeModal()}
              >
                取消
              </button>

              {modalType === "delete" ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateProduct(templateProduct.id)}
                >
                  確認
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
