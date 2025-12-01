// CHAT REALTIME – TECHSTORE
//Dùng chung cho Admin & User
const CHAT_API_BASE = "http://localhost:8000/api";

// Admin hay User?
const isAdmin = window.location.href.includes("chat-admin.html");

let currentChatUser = null;      // id khách đang chat (admin)
let pollingInterval = null;
let lastSeenMessageId = null;    // dùng để phát hiện tin mới

// Badge cho admin (menu Tin nhắn)
let adminUnreadCount = 0;

// Badge cho user (nút chat góc phải)
let userUnreadCount = 0;
let isUserChatOpen = false;

//COMMON 

// Lấy user_id từ localStorage một cách an toàn
function getCurrentUserId() {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    try {
        const u = JSON.parse(raw);
        if (u && typeof u === "object") {
            if (u.id) return u.id;                     // {id: 1, ...}
            if (u.data && u.data.id) return u.data.id; // {data: {id: 1}}
            if (u.user && u.user.id) return u.user.id; // {user: {id: 1}}
        }
    } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
    }
    return null;
}

// Render 1 tin nhắn
function renderMessage(box, msg) {
    if (!box) return;
    const div = document.createElement("div");
    div.className = `message ${msg.sender}`;   // .message.user / .message.admin
    div.innerText = msg.message;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

//Badge – Admin & User

function updateAdminBadge() {
    const badge = document.getElementById("adminChatBadge");
    if (!badge) return;
    if (adminUnreadCount > 0) {
        badge.classList.remove("d-none");
        badge.textContent = adminUnreadCount;
    } else {
        badge.classList.add("d-none");
    }
}

function updateUserBadge() {
    const badge = document.getElementById("chatBadge");
    if (!badge) return;
    if (userUnreadCount > 0) {
        badge.classList.remove("d-none");
        badge.textContent = userUnreadCount > 99 ? "99+" : userUnreadCount;
    } else {
        badge.classList.add("d-none");
    }
}

function incrementAdminBadge() {
    adminUnreadCount++;
    updateAdminBadge();
}

function resetAdminBadge() {
    adminUnreadCount = 0;
    updateAdminBadge();
}

function incrementUserBadge() {
    userUnreadCount++;
    updateUserBadge();
}

function resetUserBadge() {
    userUnreadCount = 0;
    updateUserBadge();
}

//ADMIN SIDE

async function loadUsers() {
    if (!isAdmin) return;

    const list = document.getElementById("userList");
    if (!list) return;

    list.innerHTML = `<div class="p-3 text-muted text-center">Đang tải...</div>`;

    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/users`, {
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(await res.text());
        const users = await res.json();

        list.innerHTML = "";
        users.forEach((u) => {
            const item = document.createElement("div");
            item.className = "user-item";
            item.innerHTML = `
                <strong>${u.name}</strong><br>
                <small class="text-muted">${u.last_message || ""}</small>
            `;
            item.onclick = () => openChat(u.id, u.name, item);
            list.appendChild(item);
        });
    } catch (err) {
        console.error("Lỗi load users:", err);
        list.innerHTML = `<div class="p-3 text-danger text-center">
            Không tải được danh sách khách
        </div>`;
    }
}

async function openChat(userId, name, element) {
    currentChatUser = userId;
    lastSeenMessageId = null; // reset để lần load đầu không bắn badge
    resetAdminBadge();        // mở hộp chat => coi như đã đọc

    document.querySelectorAll(".user-item").forEach((el) => {
        el.classList.remove("active");
    });
    element.classList.add("active");

    const nameSpan = document.getElementById("chatUserName");
    const input = document.getElementById("messageInput");
    const btn = document.getElementById("sendBtn");
    if (nameSpan) nameSpan.innerText = name;
    if (input) input.disabled = false;
    if (btn) btn.disabled = false;

    await loadMessages();

    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(loadMessages, 2000);
}

//LOAD TIN NHẮN (CẢ 2 BÊN)

async function loadMessages() {
    try {
        if (isAdmin) {
            // --- ADMIN: dùng #messages ---
            const box = document.getElementById("messages");
            if (!box || !currentChatUser) return;

            const res = await fetch(
                `${CHAT_API_BASE}/chat/messages?user_id=${currentChatUser}`,
                { headers: { "Accept": "application/json" } }
            );

            const text = await res.text();
            console.log("Resp /chat/messages (admin):", res.status, text);

            if (!res.ok) {
                console.error("Lỗi load messages (admin):", text);
                return;
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Không parse được JSON (admin):", e);
                return;
            }

            box.classList.remove("no-chat");
            box.innerHTML = "";
            data.forEach((m) => renderMessage(box, m));

            //Kiểm tra tin nhắn mới từ user
            const lastMsg = data[data.length - 1];
            if (lastMsg) {
                if (
                    lastSeenMessageId !== null &&           // không phải lần đầu
                    lastMsg.id !== lastSeenMessageId &&
                    lastMsg.sender === "user"               // tin từ khách
                ) {
                    incrementAdminBadge();
                }
                lastSeenMessageId = lastMsg.id;
            }
        } else {
            //USER: dùng #chatMessages
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn("Chưa xác định được user id => không load tin nhắn.");
                return; // chưa login thì thôi
            }

            const box = document.getElementById("chatMessages");
            if (!box) return;

            const res = await fetch(
                `${CHAT_API_BASE}/chat/messages?user_id=${userId}`,
                { headers: { "Accept": "application/json" } }
            );

            const text = await res.text();
            console.log("Resp /chat/messages (user):", res.status, text);

            if (!res.ok) {
                console.error("Lỗi load messages (user):", text);
                return;
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Không parse được JSON (user):", e);
                return;
            }

            box.innerHTML = "";
            data.forEach((m) => renderMessage(box, m));

            // Kiểm tra tin nhắn mới từ admin
            const lastMsg = data[data.length - 1];
            if (lastMsg) {
                if (
                    lastSeenMessageId !== null &&            // không phải lần đầu
                    lastMsg.id !== lastSeenMessageId &&
                    lastMsg.sender === "admin"               // tin từ admin
                ) {
                    // chỉ tăng badge khi hộp chat đang đóng
                    if (!isUserChatOpen) {
                        incrementUserBadge();
                    }
                }
                lastSeenMessageId = lastMsg.id;
            }
        }
    } catch (err) {
        console.error("Lỗi load messages:", err);
    }
}

//GỬI TIN NHẮN – ADMIN 

async function adminSend() {
    const input = document.getElementById("messageInput");
    if (!input) return;

    const txt = input.value.trim();
    if (!txt || !currentChatUser) return;

    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                user_id: currentChatUser,
                sender: "admin",
                message: txt,
            }),
        });

        const text = await res.text();
        console.log("Resp /chat/send (admin):", res.status, text);

        if (!res.ok) {
            console.error("Lỗi adminSend (server):", text);
            return;
        }

        input.value = "";
        await loadMessages();
    } catch (err) {
        console.error("Lỗi adminSend:", err);
    }
}

//GỬI TIN NHẮN – USER

async function userSend() {
    const input = document.getElementById("chatInput");
    if (!input) return;

    const txt = input.value.trim();
    if (!txt) return;

    const userId = getCurrentUserId();
    if (!userId) {
        alert("Bạn cần đăng nhập lại để chat với hỗ trợ!");
        return;
    }

    input.value = "";

    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/user-send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                sender: "user",
                message: txt,
            }),
        });

        const text = await res.text();
        console.log("Resp /chat/user-send (user):", res.status, text);

        if (!res.ok) {
            console.error("Lỗi userSend (server):", text);
            alert("Gửi tin nhắn thất bại!");
            return;
        }

        await loadMessages();
    } catch (err) {
        console.error("Lỗi userSend:", err);
    }
}

// POLLING USER 

function startUserPolling() {
    if (isAdmin) return;

    const userId = getCurrentUserId();
    if (!userId) {
        console.warn("Chưa login => không polling chat.");
        return;
    }

    setInterval(loadMessages, 2000);
}

// UI CHAT WIDGET – USER

function initUserChatWidget() {
    const btn = document.getElementById("chatButton");
    const box = document.getElementById("chatBox");
    const close = document.getElementById("closeChat");
    const sendBtn = document.getElementById("sendMsg");
    const input = document.getElementById("chatInput");

    if (!btn || !box) return; // không phải trang user

    // mở chat
    btn.addEventListener("click", () => {
        box.classList.add("open");
        isUserChatOpen = true;
        resetUserBadge();     // đọc hết tin mới
        loadMessages();
    });

    // đóng chat
    if (close) {
        close.addEventListener("click", () => {
            box.classList.remove("open");
            isUserChatOpen = false;
        });
    }

    // gửi tin
    if (sendBtn) sendBtn.addEventListener("click", userSend);
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") userSend();
        });
    }
}

//INIT

document.addEventListener("DOMContentLoaded", () => {
    if (isAdmin) {
        // ADMIN
        loadUsers();

        const sendBtn = document.getElementById("sendBtn");
        const input = document.getElementById("messageInput");

        if (sendBtn) sendBtn.addEventListener("click", adminSend);
        if (input) {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") adminSend();
            });
        }
    } else {
        // USER
        initUserChatWidget();
        startUserPolling();
    }
});
