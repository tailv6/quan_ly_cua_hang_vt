// CẤU HÌNH API KẾT NỐI VỚI GOOGLE SHEETS
const API_URL =
  "https://script.google.com/macros/s/AKfycbyLGDnboy-_fFG1TxYl4tzgxO6QAIHhvSazFASL7NQvsC6pFeAluBSK26YE1LdrQONMhQ/exec";

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
}

// Reset form
function initForm() {
  document.getElementById("phone").value = "";
  document.getElementById("network").value = "";
  document.getElementById("services-wrapper").innerHTML = "";
  blockCounter = 0;
  calculateTotalOrder();
  unlockServices(); // Sẽ tự ẩn khung dịch vụ
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

  if (giaThu > 0) {
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
      if (
        getRawNumber(giaThuInput.value) === "" ||
        Number(getRawNumber(giaThuInput.value)) === 0
      ) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: `Nhập "Giá thu khách" cho dịch vụ ${i + 1}!`,
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

  let completed = 0;
  for (let dataObj of dataToUpload) {
    try {
      await callGoogleAPI("addData", { dataObj: dataObj });
      completed++;
      if (completed === dataToUpload.length) {
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
      : `<button onclick="handleDeleteOrder('${orderId}')" class="text-slate-400 transition-colors bg-slate-50 w-8 h-8 rounded flex items-center justify-center mx-auto hover:text-red-500 hover:bg-red-50" title="Hủy đơn"><i class="fa-solid fa-trash-can text-sm"></i></button>`;

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
    text: "Hủy TOÀN BỘ đơn hàng này trên Sheets?",
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
