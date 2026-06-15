// CẤU HÌNH API KẾT NỐI VỚI GOOGLE SHEETS
const API_URL =
  "https://script.google.com/macros/s/AKfycbwu2F0wuog3UcdMPP0_q_bYryTA5c2WqWrK4HrX6LrTU1D_BDe3qYsDB_sgIb7KlP2s/exec";

// Cấu hình các loại dịch vụ và trường dữ liệu tương ứng
const CONFIG_SERVICES = {
  "CHUẨN HÓA, XÁC THỰC TTTB": [
    {
      sheetCol: "ma_gioi_thieu",
      label: "Mã giới thiệu",
      type: "text",
      placeholder: "Nhập mã...",
      required: false,
    },
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Nhập ghi chú...",
      required: false,
    },
  ],
  "NẠP TIỀN DI ĐỘNG": [
    {
      sheetCol: "so_tien_nap",
      label: "Số tiền nạp",
      type: "text",
      placeholder: "VD: 100.000",
      isCurrency: true,
    },
    {
      sheetCol: "thuc_tra",
      label: "Thực trả",
      type: "text",
      placeholder: "VD: 95.000",
      isCurrency: true,
    },
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Nhập ghi chú...",
      required: false,
    },
  ],
  "ĐĂNG KÝ GÓI CƯỚC DI ĐỘNG": [
    {
      sheetCol: "ten_goi",
      label: "Tên gói cước",
      type: "text",
      placeholder: "VD: MXH120...",
    },
    {
      sheetCol: "gia_goi",
      label: "Giá tiền gói",
      type: "text",
      placeholder: "VD: 120.000",
      isCurrency: true,
    },
    {
      sheetCol: "ma_gioi_thieu",
      label: "Mã giới thiệu",
      type: "text",
      placeholder: "Nhập mã...",
      required: true,
    },
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Nhập ghi chú...",
      required: false,
    },
  ],
  "BÁN SIM": [
    {
      sheetCol: "gia_tien_sim",
      label: "Giá tiền sim",
      type: "text",
      placeholder: "Nhập giá tiền...",
      isCurrency: true,
    },
    {
      sheetCol: "ma_gioi_thieu",
      label: "Mã giới thiệu",
      type: "text",
      placeholder: "Nhập mã...",
      required: false,
    },
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Nhập ghi chú...",
      required: false,
    },
  ],
  "BÁN SIM MẠNG": [
    {
      sheetCol: "ten_goi",
      label: "Tên sim",
      type: "text",
      placeholder: "Nhập tên sim...",
      required: true,
    },
    {
      sheetCol: "seri_sim",
      label: "Seri SIM",
      type: "text",
      placeholder: "Nhập số seri...",
      required: false,
    },
    {
      sheetCol: "gia_tien_sim",
      label: "Giá bán",
      type: "text",
      placeholder: "Nhập giá bán...",
      isCurrency: true,
      required: true,
    },
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Nhập ghi chú chi tiết...",
      required: false,
    },
  ],
  "DỊCH VỤ KHÁC": [
    {
      sheetCol: "ghi_chu",
      label: "Ghi chú",
      type: "text",
      placeholder: "Ghi rõ chi tiết dịch vụ...",
      required: true,
    },
  ],
};

let CURRENT_STAFF = "";
let blockCounter = 0;
let IS_EDIT_MODE = false;
let EDIT_ORDER_ID = "";
let HISTORY_CACHE = {}; // Lưu trữ dữ liệu tạm thời phục vụ cho việc sửa đơn

// Hàm gọi API
async function callGoogleAPI(action, payload) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: action, ...payload }),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
    const result = await response.json();
    if (result.status === "error") throw new Error(result.message);
    return result.data;
  } catch (error) {
    console.error("Lỗi gọi API:", error);
    throw error;
  }
}

// Khởi tạo trang nhanh
document.addEventListener("DOMContentLoaded", function () {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    // Nếu phiên cũ chưa có giờ đăng nhập thì tạo mới luôn
    if (!localStorage.getItem("loginTime")) {
      localStorage.setItem("loginTime", Date.now());
    }

    checkSessionTimeout();
    showMainApp(savedUser);
    initAutoLogout();
  } else {
    document.documentElement.classList.remove("is-logged-in");
  }
});

// Hàm đăng nhập
async function doLogin() {
  const inputId = document
    .getElementById("staff-id")
    .value.trim()
    .toUpperCase();
  const pass = document.getElementById("password").value;

  if (!inputId)
    return Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng điền Mã nhân viên!",
      confirmButtonColor: "#ee0033",
    });
  if (!pass)
    return Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng điền Mật khẩu!",
      confirmButtonColor: "#ee0033",
    });

  const btn = document.getElementById("btn-login");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xác thực...';

  try {
    const res = await callGoogleAPI("checkLogin", {
      staffId: inputId,
      pass: pass,
    });
    btn.disabled = false;
    btn.innerHTML = originalText;

    if (res.success) {
      localStorage.setItem("currentUser", res.staffId);
      localStorage.setItem("loginTime", Date.now()); // CHỐT GIỜ BẮT ĐẦU CA LÀM VIỆC
      document.getElementById("password").value = "";
      document.documentElement.classList.add("is-logged-in");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Đăng nhập thành công",
        showConfirmButton: false,
        timer: 1500,
      });
      showMainApp(res.staffId);
    } else {
      Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại",
        text: res.message,
        confirmButtonColor: "#ee0033",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi máy chủ",
      text: "Không thể kết nối. Vui lòng thử lại!",
      confirmButtonColor: "#ee0033",
    });
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Hàm đăng xuất
function logOut() {
  Swal.fire({
    title: "ĐĂNG XUẤT?",
    text: "Thoát ca làm việc hiện tại, lịch sử đơn hàng vẫn sẽ được lưu trên hệ thống!",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#ee0033",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "ĐỒNG Ý",
    cancelButtonText: "HỦY",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("loginTime"); // XÓA GIỜ BẮT ĐẦU CA KHI THOÁT
      location.reload();
    }
  });
}

// Hàm khởi tạo ứng dụng
function showMainApp(staffId) {
  CURRENT_STAFF = staffId;
  document.getElementById("welcome-msg").innerText = CURRENT_STAFF;
  document.body.style.backgroundColor = "#f1f5f9";
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-app").style.display = "block";
  initForm();
  loadHistoryFromServer(staffId);
  loadAdditionalInfo();
}

// Reset form
function initForm() {
  document.getElementById("phone").value = "";
  document.getElementById("network").value = "";
  document.getElementById("method").value = "";
  document.getElementById("services-wrapper").innerHTML = "";
  blockCounter = 0;
  calculateTotalOrder();
  unlockServices(); // Sẽ tự ẩn khung dịch vụ

  // Reset trạng thái sửa về mặc định
  IS_EDIT_MODE = false;
  EDIT_ORDER_ID = "";
  const submitBtn = document.getElementById("btn-submit");
  if (submitBtn) {
    submitBtn.innerHTML =
      '<i class="fa-solid fa-check-double"></i> HOÀN TẤT ĐƠN';
    submitBtn.className =
      "flex-1 bg-viettel hover:bg-red-700 text-white font-bold py-2.5 rounded-md transition duration-200 shadow flex justify-center items-center gap-2 text-sm";
  }
  const cancelBtn = document.getElementById("btn-cancel-edit");
  if (cancelBtn) cancelBtn.classList.add("hidden");
}

// Ẩn/Hiện phần dịch vụ dựa vào việc chọn mạng
function unlockServices() {
  const network = document.getElementById("network").value;
  const serviceSection = document.getElementById("service-section");
  const wrapper = document.getElementById("services-wrapper");

  if (network !== "") {
    serviceSection.classList.remove("hidden");
    serviceSection.classList.add("flex");
    if (wrapper.children.length === 0) addServiceBlock();
  } else {
    serviceSection.classList.add("hidden");
    serviceSection.classList.remove("flex");
  }
}

// Thêm 1 khối dịch vụ
function addServiceBlock() {
  blockCounter++;
  const blockId = "service-block-" + blockCounter;
  const optionsHtml = Object.keys(CONFIG_SERVICES)
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");

  const html = `
    <div id="${blockId}" class="service-block relative bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all">
        <label class="service-label block text-[10px] font-bold text-viettel mb-2 uppercase tracking-wide bg-red-50 inline-block px-2 py-1 rounded"></label>
        
        <select class="service-select w-full py-1.5 px-2 border border-slate-300 rounded-lg text-sm outline-none input-focus font-bold text-slate-800 bg-slate-50 appearance-none cursor-pointer" onchange="renderFields('${blockId}')">
            <option value="" class="font-normal text-slate-500">-- Chọn dịch vụ khách yêu cầu --</option>
            ${optionsHtml}
        </select>
        
        <div class="dynamic-area hidden mt-2.5 space-y-2.5">
            <div class="fields-container space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-100"></div>
            
            <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Giá Thu Khách <span class="text-red-500">*</span></label>
                    <input type="text" data-col="gia_thu" class="block-gia-thu w-full py-1.5 px-2 border border-slate-300 rounded text-sm text-right font-bold focus:border-viettel outline-none" placeholder="0" oninput="formatCurrencyInput(event); calculateBlockProfit('${blockId}')">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Lợi Nhuận Khối</label>
                    <div class="w-full py-1.5 px-2 bg-emerald-50 border border-emerald-100 rounded text-sm text-right font-bold text-emerald-600">
                        <span class="block-profit-display">0</span>
                        <input type="hidden" data-col="profit" class="block-profit-val" value="0">
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;
  document
    .getElementById("services-wrapper")
    .insertAdjacentHTML("beforeend", html);
  updateServiceLabels();
}

function updateServiceLabels() {
  const blocks = document.querySelectorAll(".service-block");
  blocks.forEach((block, index) => {
    const label = block.querySelector(".service-label");
    let deleteBtn = block.querySelector(".delete-btn");

    if (label)
      label.innerHTML = `<i class="fa-solid fa-layer-group mr-1"></i> Dịch vụ ${index + 1}`;

    if (index === 0) {
      if (deleteBtn) deleteBtn.remove();
    } else {
      if (!deleteBtn) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "delete-btn absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 w-7 h-7 rounded flex items-center justify-center";
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        btn.onclick = function () {
          block.remove();
          updateServiceLabels();
          calculateTotalOrder();
        };
        block.appendChild(btn);
      }
    }
  });
}

function renderFields(blockId) {
  const block = document.getElementById(blockId);
  const serviceName = block.querySelector(".service-select").value;
  const dynamicArea = block.querySelector(".dynamic-area");
  const fieldsContainer = block.querySelector(".fields-container");

  fieldsContainer.innerHTML = "";

  if (serviceName && CONFIG_SERVICES[serviceName]) {
    dynamicArea.style.display = "block";
    CONFIG_SERVICES[serviceName].forEach((field) => {
      const isReqText =
        field.required === false
          ? '<span class="text-slate-400 font-normal normal-case text-[10px] ml-1">(Không bắt buộc)</span>'
          : '<span class="text-red-500">*</span>';
      const inputClassExtras = field.isCurrency
        ? "pr-12 text-right font-bold"
        : "font-medium";
      const currencySpan = field.isCurrency
        ? `<span class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-[10px] font-bold">VND</span>`
        : "";
      const onInputEvt = field.isCurrency
        ? `oninput="formatCurrencyInput(event); calculateBlockProfit('${blockId}');"`
        : `oninput="calculateBlockProfit('${blockId}');"`;

      fieldsContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wide">${field.label} ${isReqText}</label>
            <div class="relative">
              <input type="${field.type}" data-col="${field.sheetCol}" data-required="${field.required !== false}" class="dynamic-input w-full py-1.5 px-2 border border-slate-300 rounded text-sm outline-none input-focus bg-white transition-colors ${inputClassExtras}" placeholder="${field.placeholder}" ${onInputEvt}>
              ${currencySpan}
            </div>
        </div>
      `,
      );
    });
  } else {
    dynamicArea.style.display = "none";
  }

  // Tắt/Mở ô Giá Thu (Chỉ khóa duy nhất đối với ĐĂNG KÝ GÓI CƯỚC DI ĐỘNG)
  const giaThuInput = block.querySelector(".block-gia-thu");
  if (serviceName === "ĐĂNG KÝ GÓI CƯỚC DI ĐỘNG") {
    giaThuInput.disabled = true;
    giaThuInput.value = "";
    giaThuInput.classList.add(
      "bg-slate-200",
      "cursor-not-allowed",
      "opacity-50",
    );
  } else {
    giaThuInput.disabled = false;
    giaThuInput.classList.remove(
      "bg-slate-200",
      "cursor-not-allowed",
      "opacity-50",
    );
  }

  // Luôn gọi tính lại lợi nhuận sau khi render trường dữ liệu mới
  calculateBlockProfit(blockId);
}

function formatCurrencyInput(e) {
  let val = e.target.value.replace(/\D/g, "");
  if (val !== "") {
    e.target.value = Number(val).toLocaleString("vi-VN");
  } else {
    e.target.value = "";
  }
}

function getRawNumber(str) {
  return str ? str.replace(/\D/g, "") : "";
}

function calculateBlockProfit(blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;

  const serviceName = block.querySelector(".service-select").value;
  const giaThuInput = block.querySelector(".block-gia-thu").value;
  let giaThu = Number(giaThuInput.replace(/\D/g, "")) || 0;
  let profit = 0;

  // Tính toán lợi nhuận ngay cả khi Giá thu là 0 (chỉ bỏ qua nếu ô bị để trống)
  if (giaThuInput.trim() !== "") {
    if (serviceName === "CHUẨN HÓA, XÁC THỰC TTTB") {
      const maGioiThieuInput = block.querySelector(
        'input[data-col="ma_gioi_thieu"]',
      );
      if (
        maGioiThieuInput &&
        maGioiThieuInput.value.trim().toUpperCase() === "LIENNTP_HNI_CNKD"
      ) {
        profit = giaThu + 10000;
      } else {
        // Nếu không nhập hoặc nhập sai mã, ô lợi nhuận vẫn hoạt động và bằng giá thu
        profit = giaThu;
      }
    } else if (serviceName === "NẠP TIỀN DI ĐỘNG") {
      const thucTraInput = block.querySelector('input[data-col="thuc_tra"]');
      if (thucTraInput) {
        let thucTra = Number(thucTraInput.value.replace(/\D/g, "")) || 0;
        profit = giaThu - thucTra;
      }
    }
  }

  block.querySelector(".block-profit-display").innerText =
    profit !== 0 ? profit.toLocaleString("vi-VN") : "0";
  block.querySelector(".block-profit-val").value = profit;
  calculateTotalOrder();
}

function calculateTotalOrder() {
  let totalThu = 0;
  let totalProfit = 0;
  const blocks = document.querySelectorAll(".service-block");

  blocks.forEach((block) => {
    let giaThu =
      Number(block.querySelector(".block-gia-thu").value.replace(/\D/g, "")) ||
      0;
    let profit = Number(block.querySelector(".block-profit-val").value) || 0;
    totalThu += giaThu;
    totalProfit += profit;
  });

  document.getElementById("total-thu-display").innerHTML =
    `${totalThu.toLocaleString("vi-VN")} <span class="text-[10px] font-normal text-slate-400">VND</span>`;
  document.getElementById("total-profit-display").innerHTML =
    `${totalProfit.toLocaleString("vi-VN")} <span class="text-[10px] font-normal text-emerald-500">VND</span>`;
}

async function sendDataToSheets() {
  const phone = document.getElementById("phone").value.trim();
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(phone))
    return Swal.fire({
      icon: "error",
      title: "SĐT không hợp lệ!",
      text: "Vui lòng nhập đúng 10 số và bắt đầu bằng 0!",
      confirmButtonColor: "#ee0033",
    });

  const network = document.getElementById("network").value;
  if (!network)
    return Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng chọn Nhà Mạng!",
      confirmButtonColor: "#ee0033",
    });

  const method = document.getElementById("method").value;
  if (!method)
    return Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng chọn Hình thức thanh toán!",
      confirmButtonColor: "#ee0033",
    });

  const blocks = document.querySelectorAll(".service-block");
  if (blocks.length === 0) return;

  const allServices = Array.from(blocks).map(
    (b) => b.querySelector(".service-select").value,
  );
  if (
    allServices.includes("BÁN SIM") &&
    !allServices.includes("ĐĂNG KÝ GÓI CƯỚC DI ĐỘNG")
  ) {
    return Swal.fire({
      icon: "error",
      title: "Thiếu dịch vụ bắt buộc",
      text: 'Đơn hàng có "BÁN SIM" yêu cầu bắt buộc phải kèm theo dịch vụ "ĐĂNG KÝ GÓI CƯỚC DI ĐỘNG"!',
      confirmButtonColor: "#ee0033",
    });
  }

  for (let i = 0; i < blocks.length; i++) {
    const sName = blocks[i].querySelector(".service-select").value;
    if (!sName)
      return Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: `Chưa chọn dịch vụ khối ${i + 1}!`,
        confirmButtonColor: "#ee0033",
      });

    const inputs = blocks[i].querySelectorAll(".dynamic-input");
    for (let j = 0; j < inputs.length; j++) {
      if (
        inputs[j].getAttribute("data-required") === "true" &&
        inputs[j].value.trim() === ""
      ) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: `Điền đủ thông tin cho dịch vụ "${sName}"!`,
          confirmButtonColor: "#ee0033",
        });
      }
    }

    const giaThuInput = blocks[i].querySelector(".block-gia-thu");
    if (!giaThuInput.disabled) {
      // Chỉ báo lỗi nếu ô Giá thu bị bỏ trống hoàn toàn, cho phép nhập số 0
      if (getRawNumber(giaThuInput.value) === "") {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: `Nhập "Giá thu khách" cho dịch vụ ${i + 1} (có thể nhập 0)!`,
          confirmButtonColor: "#ee0033",
        });
      }
    }
  }

  const submitBtn = document.getElementById("btn-submit");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.classList.add("opacity-70", "cursor-not-allowed");
  submitBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG XỬ LÝ...';

  let dataToUpload = [];
  const orderId = Date.now().toString();

  blocks.forEach((block, index) => {
    let packageData = {
      orderId: orderId,
      phone: phone,
      network: network,
      service: block.querySelector(".service-select").value,
      ma_gioi_thieu: "",
      ten_goi: "",
      so_tien_nap: "",
      gia_goi: "",
      gia_tien_sim: "",
      seri_sim: "",
      thuc_tra: "",
      ghi_chu: "",
      gia_thu: getRawNumber(block.querySelector(".block-gia-thu").value),
      profit: block.querySelector(".block-profit-val").value,
      method: index === 0 ? document.getElementById("method").value : "",
      staffId: CURRENT_STAFF,
    };

    block.querySelectorAll(".dynamic-input").forEach((input) => {
      let val = input.value;
      if (
        input.hasAttribute("oninput") &&
        input.getAttribute("oninput").includes("formatCurrencyInput")
      ) {
        val = getRawNumber(val);
      }

      packageData[input.getAttribute("data-col")] = val;
    });
    dataToUpload.push(packageData);
  });

  // --- PHÂN NHÁNH LOGIC: NẾU ĐANG Ở CHẾ ĐỘ SỬA ĐƠN ---
  if (IS_EDIT_MODE) {
    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG CẬP NHẬT...';

    // Ghi đè mã đơn hàng thành mã của đơn cũ đang sửa
    dataToUpload.forEach((item) => {
      item.orderId = EDIT_ORDER_ID;
    });

    try {
      // Gửi toàn bộ mảng dữ liệu đã sửa lên Sheets
      await callGoogleAPI("updateOrderInSheet", {
        orderId: EDIT_ORDER_ID,
        dataArray: dataToUpload,
      });

      // Tải lại bảng lịch sử để hiển thị dữ liệu mới nhất
      await loadHistoryFromServer(CURRENT_STAFF);

      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
      submitBtn.innerHTML = originalText;

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Cập nhật đơn thành công!",
        showConfirmButton: false,
        timer: 2000,
      });
      initForm(); // Khôi phục form về trạng thái ban đầu
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật",
        text: error.message,
        confirmButtonColor: "#ee0033",
      });
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  }
  // --- PHÂN NHÁNH LOGIC: NẾU LÀ TẠO ĐƠN MỚI BÌNH THƯỜNG ---
  else {
    let completed = 0;
    for (let dataObj of dataToUpload) {
      try {
        await callGoogleAPI("addData", { dataObj: dataObj });
        completed++;
        if (completed === dataToUpload.length) {
          HISTORY_CACHE[orderId] = dataToUpload; // CẬP NHẬT CACHE NGAY KHI THÊM MỚI ĐƠN, ĐỂ DỮ LIỆU LUÔN NHẤT QUÁN KHI SỬA ĐƠN
          addOrderToTable(dataToUpload, orderId, false);
          finishSubmit(submitBtn, originalText);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi ghi nhận",
          text: error.message,
          confirmButtonColor: "#ee0033",
        });
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        break;
      }
    }
  }
}

function finishSubmit(btn, originalText) {
  btn.disabled = false;
  btn.classList.remove("opacity-70", "cursor-not-allowed");
  btn.innerHTML = originalText;
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Ghi nhận đơn thành công!",
    showConfirmButton: false,
    timer: 2000,
  });
  initForm();
}

async function loadHistoryFromServer(staffId) {
  const tbody = document.getElementById("history-table");
  tbody.innerHTML =
    '<tr><td colspan="7" class="p-16 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-4xl mb-3"></i><br>Đang tải dữ liệu ca làm việc...</td></tr>';
  try {
    const historyData = await callGoogleAPI("getRecentHistory", {
      staffId: staffId,
    });
    renderHistoryData(historyData);
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="p-16 text-center text-red-500">Lỗi tải dữ liệu. Vui lòng tải lại trang.</td></tr>';
  }
}

function renderHistoryData(data) {
  const tbody = document.getElementById("history-table");
  tbody.innerHTML = "";
  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-msg"><td colspan="7" class="p-16 text-center text-slate-400 border-b-0"><div class="flex flex-col items-center justify-center"><i class="fa-regular fa-folder-open text-4xl mb-3 text-slate-300"></i><p>Chưa có giao dịch nào.</p></div></td></tr>';
    return;
  }
  let groups = {};
  let orderKeys = [];
  data.forEach((item) => {
    let k = item.orderId || "legacy_" + Math.random().toString();
    if (!groups[k]) {
      groups[k] = [];
      orderKeys.push(k);
    }
    groups[k].unshift(item);
  });

  HISTORY_CACHE = groups; // <-- THÊM DÒNG NÀY: Gán dữ liệu vào cache để dùng khi sửa đơn

  orderKeys.reverse().forEach((k) => {
    addOrderToTable(groups[k], k, true);
  });
}

function addOrderToTable(orderArray, orderId, isFromServer = false) {
  const tbody = document.getElementById("history-table");
  if (tbody.querySelector(".empty-msg")) tbody.innerHTML = "";

  let timeDisplay = "";
  let rawTimeStr =
    isFromServer && orderArray[0].timeStr ? orderArray[0].timeStr : null;
  let dateObj = rawTimeStr ? new Date(rawTimeStr) : new Date();

  if (!isNaN(dateObj.getTime())) {
    const dd = String(dateObj.getDate()).padStart(2, "0"),
      mm = String(dateObj.getMonth() + 1).padStart(2, "0"),
      yyyy = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, "0"),
      min = String(dateObj.getMinutes()).padStart(2, "0");
    timeDisplay = `<div class="font-bold text-slate-700">${dd}/${mm}/${yyyy}</div><div class="text-[10px] text-slate-400 mt-1"><i class="fa-regular fa-clock"></i> ${hh}:${min}</div>`;
  } else {
    timeDisplay =
      rawTimeStr && rawTimeStr.includes(" ")
        ? `<div class="font-bold text-slate-700">${rawTimeStr.split(" ")[0]}</div><div class="text-[10px] text-slate-400 mt-1"><i class="fa-regular fa-clock"></i> ${rawTimeStr.split(" ")[1]}</div>`
        : rawTimeStr;
  }

  let html = "";
  const rowSpan = orderArray.length;
  orderArray.forEach((data, index) => {
    let serviceStyle = "bg-blue-100 text-blue-700";
    if (data.service.includes("SIM"))
      serviceStyle = "bg-green-100 text-green-700";
    if (data.service.includes("NẠP"))
      serviceStyle = "bg-amber-100 text-amber-800";

    let networkColorClass = "text-red-500";
    if (data.network === "VINAPHONE") networkColorClass = "text-blue-600";
    else if (data.network === "MOBIFONE") networkColorClass = "text-blue-800";
    else if (data.network === "VIETNAMOBILE")
      networkColorClass = "text-orange-500";
    // XỬ LÝ MÀU HÌNH THỨC THANH TOÁN
    let methodStyle = "bg-slate-100 text-slate-600"; // Mặc định là màu xám (dành cho TIỀN MẶT)
    if (data.method === "CHUYỂN KHOẢN") {
      methodStyle = "bg-emerald-100 text-emerald-700"; // Chuyển khoản: Nền xanh lá nhạt, chữ xanh lá đậm
    }

    const isDeleted = orderArray[0].isDeleted;
    const trClasses = isDeleted
      ? `order-row-${orderId} row-deleted`
      : `order-row-${orderId} hover:bg-slate-50 transition-colors`;
    const actionBtnHtml = isDeleted
      ? `<i class="fa-solid fa-ban text-slate-400"></i>`
      : `<div class="flex items-center justify-center gap-1.5 mx-auto">
          <button onclick="handleEditOrder('${orderId}')" class="text-slate-400 transition-colors bg-slate-50 w-8 h-8 rounded flex items-center justify-center hover:text-blue-500 hover:bg-blue-50" title="Sửa đơn"><i class="fa-solid fa-pen-to-square text-sm"></i></button>
          <button onclick="handleDeleteOrder('${orderId}')" class="text-slate-400 transition-colors bg-slate-50 w-8 h-8 rounded flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Hủy đơn"><i class="fa-solid fa-trash-can text-sm"></i></button>
         </div>`;

    html += `<tr class="${trClasses}">
        ${
          index === 0
            ? `<td class="p-4 text-xs align-top bg-white border-b border-b-slate-200" rowspan="${rowSpan}">${timeDisplay}</td>
        <td class="p-4 align-top bg-white border-b border-b-slate-200" rowspan="${rowSpan}">
          <div class="font-bold text-slate-900 text-[13px]">${data.phone}</div>
          <div class="text-[10px] ${networkColorClass} font-bold tracking-widest mt-0.5">${data.network}</div>
        </td>`
            : ""
        }
        <td class="p-4 bg-white border-b border-b-slate-100"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${serviceStyle}">${data.service}</span></td>
        <td class="p-4 text-right font-bold text-slate-800 bg-white border-b border-b-slate-100">${data.gia_thu ? Number(data.gia_thu).toLocaleString("vi-VN") : "-"}</td>
        <td class="p-4 text-right font-bold text-emerald-600 bg-white border-b border-b-slate-100">${data.profit ? Number(data.profit).toLocaleString("vi-VN") : "-"}</td>
        ${
          index === 0
            ? `<td class="py-2 px-4 text-center align-middle bg-white border-b border-b-slate-200" rowspan="${rowSpan}">
          ${data.method ? `<span class="px-2 py-1 rounded text-[10px] font-bold ${methodStyle}">${data.method}</span>` : "-"}
        </td>
        <td class="py-2 px-4 text-center align-middle bg-white border-b border-b-slate-200" rowspan="${rowSpan}">${actionBtnHtml}</td>`
            : ""
        }
    </tr>`;
  });
  tbody.insertAdjacentHTML("afterbegin", html);
}

async function handleDeleteOrder(orderId) {
  const confirmDelete = await Swal.fire({
    title: "Xác nhận hủy?",
    text: "Hủy TOÀN BỘ đơn hàng này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ee0033",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "Đồng ý",
    cancelButtonText: "Quay lại",
  });
  if (!confirmDelete.isConfirmed) return;

  const rows = document.querySelectorAll(`.order-row-${orderId}`);
  rows.forEach((row) => {
    row.classList.add("row-deleted");
    const btn = row.querySelector("button");
    if (btn) {
      btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin text-slate-400"></i>';
      btn.onclick = null;
    }
  });

  try {
    const success = await callGoogleAPI("deleteOrderInSheet", {
      orderId: orderId,
    });
    if (success) {
      rows.forEach((row) => {
        const btn = row.querySelector(".fa-spinner");
        if (btn)
          btn.parentElement.innerHTML =
            '<i class="fa-solid fa-ban text-slate-400"></i>';
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Đã hủy đơn!",
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể gạch ngang dữ liệu!",
        confirmButtonColor: "#ee0033",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi mạng",
      text: "Mất kết nối!",
      confirmButtonColor: "#ee0033",
    });
  }
}

// ==========================================
// QUẢN LÝ TỰ ĐỘNG ĐĂNG XUẤT (CỨNG 12 TIẾNG TỪ LÚC LOGIN)
// ==========================================
const SESSION_TIMEOUT = 12 * 60 * 60 * 1000; // 12 tiếng

function checkSessionTimeout() {
  const savedUser = localStorage.getItem("currentUser");
  if (!savedUser) return;

  const loginTime = localStorage.getItem("loginTime");
  const currentTime = Date.now();

  // Nếu đã quá 12 tiếng kể từ lúc bắt đầu ca
  if (loginTime && currentTime - parseInt(loginTime) > SESSION_TIMEOUT) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("loginTime");

    Swal.fire({
      icon: "warning",
      title: "Phiên làm việc đã hết hạn",
      text: "Vui lòng đăng nhập lại để tiếp tục!",
      confirmButtonColor: "#ee0033",
      confirmButtonText: "Đăng nhập lại",
      allowOutsideClick: false,
    }).then(() => {
      location.reload();
    });
  }
}

function initAutoLogout() {
  // Chỉ chạy ngầm kiểm tra mỗi 1 phút, KHÔNG bắt sự kiện click/phím nữa
  setInterval(checkSessionTimeout, 60000);
}

// Hàm kích hoạt chế độ sửa và đổ ngược dữ liệu lên Form
function handleEditOrder(orderId) {
  const orderArray = HISTORY_CACHE[orderId];
  if (!orderArray || orderArray.length === 0) return;
  switchView("add-order");

  // 1. Chuyển trạng thái hệ thống sang chế độ sửa
  IS_EDIT_MODE = true;
  EDIT_ORDER_ID = orderId;

  // 2. Điền thông tin cơ bản thuê bao
  document.getElementById("phone").value = orderArray[0].phone || "";
  document.getElementById("network").value = orderArray[0].network || "";

  // Hiển thị và mở khóa khu vực dịch vụ
  const serviceSection = document.getElementById("service-section");
  serviceSection.classList.remove("hidden");
  serviceSection.classList.add("flex");

  // Xóa trắng các block dịch vụ trống mặc định hiện tại trên form
  const wrapper = document.getElementById("services-wrapper");
  wrapper.innerHTML = "";
  blockCounter = 0;

  // 3. Đổ tuần tự từng khối dịch vụ thuộc đơn hàng này lên form
  orderArray.forEach((data) => {
    addServiceBlock(); // Tự động tạo 1 block mới, tăng blockCounter lên
    const blockId = "service-block-" + blockCounter;
    const block = document.getElementById(blockId);

    // Chọn loại dịch vụ tương ứng
    block.querySelector(".service-select").value = data.service;
    renderFields(blockId); // Gọi hàm render các input động cho dịch vụ này

    // Điền các trường dữ liệu động cấu hình sẵn
    block.querySelectorAll(".dynamic-input").forEach((input) => {
      const col = input.getAttribute("data-col");
      if (data[col] !== undefined && data[col] !== "") {
        let val = data[col];
        if (
          input.hasAttribute("oninput") &&
          input.getAttribute("oninput").includes("formatCurrencyInput")
        ) {
          input.value = Number(val).toLocaleString("vi-VN");
        } else {
          input.value = val;
        }
      }
    });

    // Điền giá thu khách
    const giaThuInput = block.querySelector(".block-gia-thu");
    if (data.gia_thu) {
      giaThuInput.value = Number(data.gia_thu).toLocaleString("vi-VN");
    }

    // Tính toán lại lợi nhuận của riêng khối này
    calculateBlockProfit(blockId);
  });

  // Điền hình thức thanh toán
  if (orderArray[0].method) {
    document.getElementById("method").value = orderArray[0].method;
  }

  // 4. Thay đổi giao diện nút Hoàn tất -> Cập nhật
  const submitBtn = document.getElementById("btn-submit");
  submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> CẬP NHẬT ĐƠN';
  submitBtn.className =
    "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md transition duration-200 shadow flex justify-center items-center gap-2 text-sm";

  document.getElementById("btn-cancel-edit").classList.remove("hidden");

  // Cuộn mượt màn hình lên trên cùng để nhân viên thao tác sửa đơn
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Hàm thoát chế độ sửa đơn
function cancelEditMode() {
  initForm();
}

// ==========================================
// TỰ ĐỘNG FOCUS LẠI Ô NHẬP LIỆU KHI CHUYỂN TAB
// ==========================================
let lastFocusedElement = null;

// Ghi nhớ ô input/select cuối cùng mà người dùng click vào
document.addEventListener("focusin", function (e) {
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "SELECT" ||
    e.target.tagName === "TEXTAREA"
  ) {
    lastFocusedElement = e.target;
  }
});

// Khi người dùng quay trở lại cửa sổ/tab web này
window.addEventListener("focus", function () {
  // Kiểm tra xem phần tử đó có còn tồn tại trên giao diện không
  // (tránh lỗi nếu đó là ô input thuộc khối dịch vụ vừa bị người dùng ấn nút xóa)
  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    // Độ trễ 50ms giúp trình duyệt xử lý xong giao diện trước khi ép con trỏ chuột hiện lên
    setTimeout(() => {
      lastFocusedElement.focus();
    }, 50);
  }
});

// ==========================================
// XỬ LÝ KHỐI THÔNG TIN THÊM (MÃ CTV, LINK...)
// ==========================================
async function loadAdditionalInfo() {
  try {
    const infoContainer = document.getElementById("extra-info-container");
    const section = document.getElementById("extra-info-section");

    // Gọi API lấy dữ liệu từ Google Sheets
    const data = await callGoogleAPI("getAdditionalInfo", {});

    if (data && data.length > 0) {
      section.classList.remove("hidden"); // Hiện khối thông tin lên
      let html = "";

      data.forEach((item) => {
        html += `
          <div class="p-2 border border-slate-100 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
              <div class="flex justify-between items-start gap-2 mb-1.5">
                  <div class="font-bold text-[11px] text-slate-800 uppercase">${item.ten_goi}</div>
                  <button onclick="copyToClipboard('${item.thong_tin}', this)" class="text-slate-500 hover:text-viettel bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm">
                      <i class="fa-regular fa-copy"></i> Copy
                  </button>
              </div>
              <div class="text-[11px] font-semibold text-slate-700 break-all bg-white px-2 py-1.5 border border-slate-200 rounded">${item.thong_tin}</div>
              ${item.ghi_chu ? `<div class="text-[9px] text-slate-400 mt-1 italic"><i class="fa-solid fa-circle-info text-[8px]"></i> ${item.ghi_chu}</div>` : ""}
          </div>
        `;
      });
      infoContainer.innerHTML = html;
    } else {
      infoContainer.innerHTML = `<div class="text-center text-[10px] text-slate-400 py-4">Chưa có thông tin nào trên Sheet.</div>`;
    }
  } catch (error) {
    console.error("Lỗi tải thông tin thêm:", error);
    document.getElementById("extra-info-container").innerHTML =
      `<div class="text-center text-red-500 text-[10px] py-4">Lỗi kết nối khi tải Thông tin thêm.</div>`;
  }
}

// Hàm xử lý copy text và đổi hiệu ứng nút
function copyToClipboard(text, btnElement) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Lưu lại HTML gốc
      const originalHtml = btnElement.innerHTML;

      // Đổi giao diện nút thành Đã Copy
      btnElement.innerHTML =
        '<i class="fa-solid fa-check text-emerald-500"></i> Đã Copy';
      btnElement.classList.add(
        "border-emerald-200",
        "text-emerald-600",
        "bg-emerald-50",
      );

      // Trả lại giao diện ban đầu sau 1.5 giây
      setTimeout(() => {
        btnElement.innerHTML = originalHtml;
        btnElement.classList.remove(
          "border-emerald-200",
          "text-emerald-600",
          "bg-emerald-50",
        );
      }, 1500);
    })
    .catch((err) => {
      console.error("Lỗi khi copy: ", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Trình duyệt chặn Copy!",
        showConfirmButton: false,
        timer: 1500,
      });
    });
}

// ==========================================
// XỬ LÝ KHỐI NÚT NỔI (ASSISTIVE TOUCH)
// ==========================================
async function loadAdditionalInfo() {
  try {
    const infoContainer = document.getElementById("floating-info-container");

    // Gọi API lấy dữ liệu từ Google Sheets
    const data = await callGoogleAPI("getAdditionalInfo", {});

    if (data && data.length > 0) {
      let html = "";

      data.forEach((item) => {
        html += `
          <div class="p-3 border border-slate-200 rounded-xl bg-white hover:border-viettel/30 transition-colors shadow-sm">
              <div class="flex justify-between items-start gap-2 mb-2">
                  <div class="font-bold text-[12px] text-slate-800 uppercase leading-tight mt-0.5">${item.ten_goi}</div>
                  <button onclick="copyToClipboard('${item.thong_tin}', this)" class="text-slate-500 hover:text-viettel bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0">
                      <i class="fa-regular fa-copy"></i> Copy
                  </button>
              </div>
              <div class="text-[12px] font-semibold text-slate-700 break-all bg-slate-50 px-2.5 py-2 border border-slate-100 rounded text-center tracking-wide">${item.thong_tin}</div>
              ${item.ghi_chu ? `<div class="text-[10px] text-slate-400 mt-2 italic flex gap-1.5 leading-snug"><i class="fa-solid fa-circle-info mt-0.5"></i> <span>${item.ghi_chu}</span></div>` : ""}
          </div>
        `;
      });
      infoContainer.innerHTML = html;
    } else {
      infoContainer.innerHTML = `<div class="text-center text-[11px] text-slate-400 py-6">Chưa có thông tin nào trên Sheet.</div>`;
    }
  } catch (error) {
    console.error("Lỗi tải thông tin thêm:", error);
    document.getElementById("floating-info-container").innerHTML =
      `<div class="text-center text-red-500 text-[11px] py-6">Lỗi kết nối.</div>`;
  }
}

// Hàm bật/tắt bảng thông tin
function toggleExtraInfo() {
  const panel = document.getElementById("floating-info-panel");
  if (panel.classList.contains("hidden")) {
    panel.classList.remove("hidden");
    panel.classList.add("animate-fade-in-up");
  } else {
    panel.classList.add("hidden");
    panel.classList.remove("animate-fade-in-up");
  }
}

// Hàm xử lý copy text
function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHtml = btnElement.innerHTML;

    btnElement.innerHTML =
      '<i class="fa-solid fa-check text-emerald-500"></i> Copy xong';
    btnElement.classList.add(
      "border-emerald-200",
      "text-emerald-600",
      "bg-emerald-50",
    );

    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.classList.remove(
        "border-emerald-200",
        "text-emerald-600",
        "bg-emerald-50",
      );
    }, 1500);
  });
}

// ==========================================
// TỰ ĐỘNG ĐÓNG BẢNG THÔNG TIN KHI CLICK RA NGOÀI
// ==========================================
document.addEventListener("click", function (event) {
  const panel = document.getElementById("floating-info-panel");

  // Tìm khối div tổng bao quanh cả nút bấm tròn và bảng thông tin
  const floatingContainer = panel ? panel.closest(".fixed") : null;

  // Kiểm tra: Nếu bảng đang MỞ (không bị ẩn) VÀ vị trí click chuột KHÔNG nằm trong khối div đó
  if (
    panel &&
    !panel.classList.contains("hidden") &&
    floatingContainer &&
    !floatingContainer.contains(event.target)
  ) {
    // Thu lại bảng
    panel.classList.add("hidden");
    panel.classList.remove("animate-fade-in-up");
  }
});

// ==========================================
// ĐIỀU HƯỚNG TABS (SIDEBAR)
// ==========================================
function switchView(viewName) {
  const views = ["add-order", "history", "report"];

  // Xử lý ẩn/hiện nút nổi (chỉ hiện ở tab add-order)
  const floatingBtnWrapper = document.getElementById("floating-button-wrapper");
  if (floatingBtnWrapper) {
    if (viewName === "add-order") {
      floatingBtnWrapper.classList.remove("hidden");
      floatingBtnWrapper.classList.add("flex");
    } else {
      floatingBtnWrapper.classList.add("hidden");
      floatingBtnWrapper.classList.remove("flex");
    }
  }

  views.forEach((v) => {
    const el = document.getElementById("view-" + v);
    const nav = document.getElementById("nav-" + v);

    if (v === viewName) {
      el.classList.remove("hidden");
      el.classList.add(v === "add-order" ? "block" : "flex");
      nav.className =
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors bg-red-50 text-viettel";

      // Tự động set ngày hôm nay cho tab report nếu chưa có
      if (v === "report") {
        const dateInput = document.getElementById("report-date");
        if (!dateInput.value) {
          dateInput.valueAsDate = new Date();
          loadDailyReport(); // Tự động load báo cáo ngày hiện tại
        }
      }
    } else {
      el.classList.add("hidden");
      el.classList.remove("flex", "block");
      nav.className =
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors text-slate-500 hover:bg-slate-50 hover:text-slate-800";
    }
  });
}

// ==========================================
// XỬ LÝ BÁO CÁO GIAO DỊCH
// ==========================================
async function loadDailyReport() {
  const dateInput = document.getElementById("report-date").value;
  if (!dateInput)
    return Swal.fire({ icon: "warning", title: "Vui lòng chọn ngày!" });

  const [year, month, day] = dateInput.split("-");
  const formattedDate = `${day}/${month}/${year}`;

  const tbody = document.getElementById("report-table");

  tbody.innerHTML =
    '<tr><td colspan="10" class="p-16 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-4xl mb-3"></i><br>Đang tổng hợp dữ liệu...</td></tr>';

  try {
    const reportData = await callGoogleAPI("getDailyReport", {
      dateStr: formattedDate,
    });
    renderDailyReport(reportData, formattedDate);
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="10" class="p-16 text-center text-red-500">Lỗi tải báo cáo.</td></tr>';
  }
}

function renderDailyReport(data, dateStr) {
  const tbody = document.getElementById("report-table");

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-msg"><td colspan="10" class="p-16 text-center text-slate-400">Không có giao dịch nào trong ngày này.</td></tr>';
    return;
  }

  // Group dữ liệu theo orderId
  let ordersGroup = {};
  let orderKeys = [];

  data.forEach((item) => {
    let k = item.orderId || "legacy_" + Math.random().toString();
    if (!ordersGroup[k]) {
      ordersGroup[k] = [];
      orderKeys.push(k);
    }
    ordersGroup[k].push(item);
  });

  // Render HTML Bảng Dữ Liệu
  let html = "";
  let stt = 1;

  // Đảo ngược để hiển thị đơn mới nhất lên trên
  orderKeys.forEach((k) => {
    let orderArray = ordersGroup[k];
    let rowSpan = orderArray.length;

    // Tìm hình thức thanh toán của đơn
    let actualMethod =
      orderArray.find((item) => item.method && item.method.trim() !== "")
        ?.method || "";
    let methodStyle =
      actualMethod === "CHUYỂN KHOẢN"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-600";

    // --- TÍNH TỔNG GIÁ THU CỦA CẢ ĐƠN HÀNG ---
    let totalGiaThu = orderArray.reduce(
      (sum, item) => sum + (Number(item.gia_thu) || 0),
      0,
    );

    orderArray.forEach((sv, idx) => {
      let networkColor =
        sv.network === "VINAPHONE"
          ? "text-blue-600"
          : sv.network === "MOBIFONE"
            ? "text-blue-800"
            : sv.network === "VIETNAMOBILE"
              ? "text-orange-500"
              : "text-red-500";
      // 1. Kiểm tra xem đây có phải là dòng cuối cùng của đơn hàng này không
      let isLastService = idx === rowSpan - 1;

      // 2. Nếu là dòng cuối cùng thì dùng border dày hơn (border-b-2) và màu đậm hơn (border-slate-400 hoặc border-slate-500)
      let borderClass = isLastService
        ? "border-b-2 border-slate-300"
        : "border-b border-slate-50";

      html += `<tr class="${borderClass} hover:bg-slate-50 transition-colors">`;

      // Các cột thông tin chung của Đơn hàng
      if (idx === 0) {
        html += `<td rowspan="${rowSpan}" class="p-3 text-center border-r border-slate-200 bg-white align-middle font-bold text-slate-500">${stt++}</td>`;
        html += `<td rowspan="${rowSpan}" class="p-3 border-r border-slate-200 bg-white align-middle">
                    <div class="font-bold text-slate-700">${sv.timeStr.split(" ")[0]}</div>
                    <div class="text-[10px] text-slate-400"><i class="fa-regular fa-clock"></i> ${sv.timeStr.split(" ")[1] || ""}</div>
                 </td>`;
        html += `<td rowspan="${rowSpan}" class="p-3 border-r border-slate-200 bg-white align-middle font-bold text-blue-600 uppercase">${sv.staffId}</td>`;
        html += `<td rowspan="${rowSpan}" class="p-3 border-r border-slate-200 bg-white align-middle font-bold text-slate-800">${sv.phone}</td>`;
        html += `<td rowspan="${rowSpan}" class="p-3 border-r border-slate-200 bg-white align-middle text-[10px] font-bold ${networkColor} tracking-widest">${sv.network}</td>`;
      }

      // Cột Dịch vụ
      html += `<td class="p-3 border-r border-slate-100 text-[11px] font-bold uppercase text-slate-700 align-middle">${sv.service}</td>`;

      // --- CỘT GIÁ THU ĐÃ ĐƯỢC GỘP (Chỉ in ở dòng đầu tiên của đơn) ---
      if (idx === 0) {
        html += `<td rowspan="${rowSpan}" class="p-3 border-r border-slate-200 bg-white text-right font-bold text-slate-800 align-middle text-[13px]">${totalGiaThu ? totalGiaThu.toLocaleString("vi-VN") : "-"}</td>`;
      }

      // Cột Lợi nhuận
      html += `<td class="p-3 border-r border-slate-100 text-right font-bold text-emerald-600 align-middle">${sv.profit ? Number(sv.profit).toLocaleString("vi-VN") : "-"}</td>`;

      // Xử lý ghép chuỗi Ghi chú chi tiết
      let detailHtml = "";
      const extraFields = {
        "Tên gói/Sim": sv.ten_goi, // Đổi nhãn một chút cho phù hợp cả 2 dịch vụ
        "Seri SIM": sv.seri_sim, // Thêm hiển thị Seri SIM
        "Giá gói": sv.gia_goi,
        "Số tiền nạp": sv.so_tien_nap,
        "Thực trả": sv.thuc_tra,
        "Tên sim": sv.ten_sim_mang,
        "Giá sim": sv.gia_tien_sim,
        "Mã G.Thiệu": sv.ma_gioi_thieu,
      };

      for (let label in extraFields) {
        let val = extraFields[label];
        if (val !== undefined && val !== null && val !== "") {
          if (
            ["Giá gói", "Số tiền nạp", "Thực trả", "Giá sim"].includes(label) &&
            !isNaN(val)
          ) {
            val = Number(val).toLocaleString("vi-VN");
          }
          detailHtml += `<div class="leading-relaxed mb-0.5"><span class="font-semibold text-slate-600">${label}:</span> <span class="text-slate-800">${val}</span></div>`;
        }
      }

      if (sv.ghi_chu && sv.ghi_chu !== "") {
        let borderTop =
          detailHtml !== "" ? "mt-1 pt-1 border-t border-slate-100" : "";
        detailHtml += `<div class="${borderTop} italic text-slate-500 leading-relaxed"><span class="font-semibold text-slate-600">Ghi chú:</span> ${sv.ghi_chu}</div>`;
      }

      html += `<td class="p-3 border-r border-slate-100 text-[11px] align-middle">${detailHtml}</td>`;

      // Cột Hình thức thanh toán
      if (idx === 0) {
        html += `<td rowspan="${rowSpan}" class="p-3 bg-white align-middle text-center">
                    ${actualMethod ? `<span class="inline-block whitespace-nowrap px-2 py-1 rounded text-[10px] font-bold ${methodStyle}">${actualMethod}</span>` : "-"}
                 </td>`;
      }

      html += `</tr>`;
    });
  });

  tbody.innerHTML = html;
}
