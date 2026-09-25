(() => {
  "use strict";

  const STORAGE_KEY = "reviewhub_v2_reviews";

  const defaultReviews = [
    {id:1,name:"Rizky",service:"Rental PS",rating:5,title:"Tempat nyaman dan seru!",text:"PS-nya enak dimainkan dan tempatnya cukup nyaman. Pasti main lagi.",recommend:true,likes:8,date:"Hari ini"},
    {id:2,name:"Dimas",service:"Bioskop Mini",rating:5,title:"Nonton jadi lebih seru",text:"Suasana nyaman dan cocok untuk nonton bersama teman.",recommend:true,likes:5,date:"Hari ini"},
    {id:3,name:"Aulia",service:"Pesan Makanan",rating:4,title:"Makanannya enak",text:"Pesanan cukup cepat datang. Rasanya juga enak.",recommend:true,likes:4,date:"Kemarin"},
    {id:4,name:"Fajar",service:"Rental PS",rating:4,title:"Pelayanannya ramah",text:"Admin ramah dan proses pesan tempat cukup mudah.",recommend:true,likes:7,date:"Kemarin"},
    {id:5,name:"Nadia",service:"Bioskop Mini",rating:3,title:"Lumayan nyaman",text:"Secara keseluruhan bagus, tetapi pilihan film bisa ditambah.",recommend:true,likes:3,date:"2 hari lalu"},
    {id:6,name:"Bayu",service:"Pesan Makanan",rating:5,title:"Pesanan cepat!",text:"Makanan datang sesuai pesanan dan masih hangat.",recommend:true,likes:9,date:"2 hari lalu"}
  ];

  const $ = (id) => document.getElementById(id);

  let reviews = loadReviews();
  let selectedRating = 0;

  function loadReviews() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [...defaultReviews];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [...defaultReviews];
    } catch {
      return [...defaultReviews];
    }
  }

  function saveReviews() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // Website tetap berjalan meskipun localStorage diblokir browser.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[char]));
  }

  function stars(value) {
    const n = Math.max(0, Math.min(5, Number(value) || 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function filteredReviews() {
    const query = $("searchInput").value.trim().toLowerCase();
    const service = $("serviceFilter").value;
    const rating = $("ratingFilter").value;

    return reviews.filter((review) => {
      const haystack = `${review.name} ${review.title} ${review.text} ${review.service}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesService = service === "all" || review.service === service;
      const matchesRating = rating === "all" || String(review.rating) === rating;
      return matchesQuery && matchesService && matchesRating;
    });
  }

  function renderReviews() {
    const list = filteredReviews();
    const container = $("reviewList");

    container.innerHTML = list.map((review) => `
      <article class="review-card">
        <div class="review-head">
          <div class="review-name">${escapeHtml(review.name)}</div>
          <span class="service-tag">${escapeHtml(review.service)}</span>
        </div>
        <div class="stars">${stars(review.rating)}</div>
        <h3>${escapeHtml(review.title)}</h3>
        <p>${escapeHtml(review.text)}</p>
        <div class="review-foot">
          <span>${escapeHtml(review.date)}</span>
          <button class="like-btn" type="button" data-like="${review.id}" aria-label="Sukai ulasan">
            ♡ ${Number(review.likes) || 0}
          </button>
        </div>
      </article>
    `).join("");

    $("emptyState").classList.toggle("hidden", list.length !== 0);

    container.querySelectorAll("[data-like]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.like);
        const item = reviews.find((review) => review.id === id);
        if (!item) return;
        item.likes = (Number(item.likes) || 0) + 1;
        saveReviews();
        renderReviews();
      });
    });
  }

  function updateStats() {
    const total = reviews.length;
    const average = total
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;

    const rounded = Math.round(average);

    $("heroTotal").textContent = total;
    $("heroAverage").textContent = average.toFixed(1);
    $("heroOrb").textContent = average.toFixed(1);
    $("heroStars").textContent = stars(rounded);

    $("averageNumber").textContent = average.toFixed(1);
    $("averageStars").textContent = stars(rounded);
    $("totalReviews").textContent = total;

    for (let rating = 1; rating <= 5; rating++) {
      const count = reviews.filter((review) => Number(review.rating) === rating).length;
      const percent = total ? (count / total) * 100 : 0;
      $(`count${rating}`).textContent = count;
      $(`bar${rating}`).style.width = `${percent}%`;
    }
  }

  function render() {
    renderReviews();
    updateStats();
    saveReviews();
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setRating(value) {
    selectedRating = Number(value);
    document.querySelectorAll("#starPicker button").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.rating) <= selectedRating);
    });

    const labels = {
      1:"Sangat mengecewakan",
      2:"Kurang memuaskan",
      3:"Cukup baik",
      4:"Sangat baik",
      5:"Luar biasa!"
    };
    $("ratingHelp").textContent = labels[selectedRating] || "Pilih rating 1–5";
  }

  function openModal(title, body) {
    $("modalTitle").textContent = title;
    $("modalBody").textContent = body;
    $("modalBackdrop").hidden = false;
  }

  function closeModal() {
    $("modalBackdrop").hidden = true;
  }

  document.querySelectorAll("#starPicker button").forEach((button) => {
    button.addEventListener("click", () => setRating(button.dataset.rating));
  });

  $("textInput").addEventListener("input", () => {
    $("charCount").textContent = $("textInput").value.length;
  });

  $("reviewForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("nameInput").value.trim();
    const service = $("serviceInput").value;
    const title = $("titleInput").value.trim();
    const text = $("textInput").value.trim();
    const recommend = $("recommendInput").checked;

    if (!name || !service || !title || !text) {
      showToast("Lengkapi semua data ulasan terlebih dahulu.");
      return;
    }

    if (!selectedRating) {
      showToast("Pilih rating 1 sampai 5 bintang.");
      return;
    }

    const newReview = {
      id: Date.now(),
      name,
      service,
      rating: selectedRating,
      title,
      text,
      recommend,
      likes: 0,
      date: "Baru saja"
    };

    reviews.unshift(newReview);
    saveReviews();
    render();

    $("reviewForm").reset();
    selectedRating = 0;
    document.querySelectorAll("#starPicker button").forEach((button) => button.classList.remove("selected"));
    $("ratingHelp").textContent = "Pilih rating 1–5";
    $("charCount").textContent = "0";

    showToast("Ulasan berhasil ditambahkan!");
    window.location.hash = "ulasan";
  });

  $("searchInput").addEventListener("input", renderReviews);
  $("serviceFilter").addEventListener("change", renderReviews);
  $("ratingFilter").addEventListener("change", renderReviews);

  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      $("serviceInput").value = card.dataset.service;
      document.getElementById("beri-ulasan").scrollIntoView({behavior:"smooth"});
      setTimeout(() => $("nameInput").focus(), 500);
    });
  });

  $("menuBtn").addEventListener("click", () => {
    const open = $("navLinks").classList.toggle("open");
    $("menuBtn").setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("#navLinks a").forEach((link) => {
    link.addEventListener("click", () => {
      $("navLinks").classList.remove("open");
      $("menuBtn").setAttribute("aria-expanded", "false");
    });
  });

  $("contactBtn").addEventListener("click", () => {
    openModal("Hubungi Kami", "Ganti informasi ini dengan nomor WhatsApp, nomor telepon, alamat, atau akun media sosial bisnis kamu di file HTML.");
  });

  $("reportBtn").addEventListener("click", () => {
    openModal("Laporkan Masalah", "Untuk sementara, tuliskan masalah melalui form Kritik & Saran. Bagian ini dapat dikembangkan menjadi sistem laporan dengan backend.");
  });

  $("modalClose").addEventListener("click", closeModal);
  $("modalBackdrop").addEventListener("click", (event) => {
    if (event.target === $("modalBackdrop")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  $("year").textContent = new Date().getFullYear();

  render();
})();