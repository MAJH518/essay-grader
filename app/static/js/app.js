document.addEventListener("DOMContentLoaded", () => {
    // --- DOM References ---
    const formSection = document.getElementById("form-section");
    const loadingSection = document.getElementById("loading-section");
    const errorSection = document.getElementById("error-section");
    const resultSection = document.getElementById("result-section");
    const focusResultSection = document.getElementById("focus-result-section");

    const essayText = document.getElementById("essay-text");
    const topicInput = document.getElementById("topic");
    const essayType = document.getElementById("essay-type");
    const focusInput = document.getElementById("focus");
    const charCount = document.getElementById("char-count");
    const submitBtn = document.getElementById("submit-btn");
    const formError = document.getElementById("form-error");

    const errorMessage = document.getElementById("error-message");
    const retryBtn = document.getElementById("retry-btn");
    const gradeAgainBtn = document.getElementById("grade-again-btn");
    const exampleBtn = document.getElementById("example-btn");

    let gradingData = null;

    // --- Example Essay ---
    const EXAMPLE_ESSAY = `The Impact of Technology on Modern Education

In today's rapidly evolving world, technology has become an integral part of our daily lives, and education is no exception. While some people argue that traditional teaching methods remain superior, I firmly believe that technology has significantly enhanced the learning experience in multiple ways.

Firstly, technology has made education more accessible than ever before. Students from remote areas can now attend virtual classrooms and access high-quality educational resources online. For instance, platforms like Coursera and Khan Academy provide free courses to millions of learners worldwide. This democratization of knowledge was simply unimaginable a few decades ago.

Secondly, interactive learning tools have transformed the way students engage with complex subjects. Virtual laboratories, educational games, and simulation software make abstract concepts tangible and easier to understand. A student studying biology can now explore the human body in 3D rather than relying solely on textbook diagrams. This hands-on approach not only improves comprehension but also makes learning more enjoyable.

However, we must also acknowledge the challenges that come with technology integration. Excessive screen time can lead to health issues such as eye strain and reduced physical activity. Moreover, the digital divide between wealthy and underprivileged students raises concerns about educational inequality. Schools must therefore implement technology thoughtfully, ensuring that it supplements rather than replaces human interaction.

In conclusion, while technology presents certain challenges, its benefits to modern education are undeniable. By making learning more accessible, engaging, and effective, technology has fundamentally improved how we acquire knowledge. The key lies in striking a balance between innovation and traditional teaching values.`;

    exampleBtn.addEventListener("click", () => {
        essayText.value = EXAMPLE_ESSAY;
        updateCharCount();
        hideFormError();
    });

    // --- Character Counter ---
    essayText.addEventListener("input", () => {
        updateCharCount();
        hideFormError();
    });

    function updateCharCount() {
        const len = essayText.value.length;
        charCount.textContent = `${len} / 5000 字符`;
        if (len > 5000) {
            charCount.classList.add("text-red-500");
        } else if (len > 4500) {
            charCount.classList.add("text-orange-500");
            charCount.classList.remove("text-red-500");
        } else {
            charCount.classList.remove("text-red-500", "text-orange-500");
        }
    }

    // --- Form Error Helpers ---
    function showFormError(msg) {
        formError.textContent = msg;
        formError.classList.remove("hidden");
    }

    function hideFormError() {
        formError.classList.add("hidden");
    }

    // --- Section Visibility ---
    const allSections = [formSection, loadingSection, errorSection, resultSection, focusResultSection];
    function showSection(section) {
        allSections.forEach((s) => {
            if (s === section) {
                s.classList.remove("hidden-section");
                s.classList.add("visible-section");
            } else {
                s.classList.remove("visible-section");
                s.classList.add("hidden-section");
            }
        });
    }

    // --- Client-Side Validation ---
    function validateForm() {
        const text = essayText.value.trim();
        if (!text) {
            showFormError("请输入你的作文内容。");
            return false;
        }
        if (text.length < 50) {
            showFormError(`作文太短，请至少输入 50 个字符（当前 ${text.length} 个字符）。`);
            return false;
        }
        if (text.length > 5000) {
            showFormError(`作文超过 5000 字符限制，请精简内容（当前 ${text.length} 个字符）。`);
            return false;
        }
        return true;
    }

    // --- Submit Handler ---
    submitBtn.addEventListener("click", async () => {
        if (!validateForm()) return;

        showSection(loadingSection);
        submitBtn.disabled = true;

        try {
            const response = await fetch("/api/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    essay_text: essayText.value.trim(),
                    topic: topicInput.value.trim() || null,
                    essay_type: essayType.value,
                    focus: focusInput.value.trim() || null,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `服务器错误 (HTTP ${response.status})`);
            }

            gradingData = await response.json();
            if (gradingData.focus_area !== undefined) {
                renderFocusResults(gradingData);
                showSection(focusResultSection);
            } else {
                renderResults(gradingData);
                showSection(resultSection);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            showSection(errorSection);
            errorMessage.textContent = err.message || "发生未知错误，请重试。";
        } finally {
            submitBtn.disabled = false;
        }
    });

    // --- Keyboard Shortcut: Ctrl+Enter ---
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (formSection.classList.contains("visible-section")) {
                submitBtn.click();
            } else if (focusResultSection.classList.contains("visible-section")) {
                document.getElementById("focus-grade-again-btn").click();
            }
        }
    });

    // --- Render Results ---
    function renderResults(data) {
        // Total score
        document.getElementById("total-score").textContent = Math.round(data.total_score);

        // Grade badge
        const badge = document.getElementById("grade-badge");
        const score = data.total_score;
        let grade, badgeColor;
        if (score >= 90) { grade = "A - 优秀"; badgeColor = "bg-green-100 text-green-700"; }
        else if (score >= 80) { grade = "B - 良好"; badgeColor = "bg-blue-100 text-blue-700"; }
        else if (score >= 70) { grade = "C - 一般"; badgeColor = "bg-yellow-100 text-yellow-700"; }
        else if (score >= 60) { grade = "D - 需改进"; badgeColor = "bg-orange-100 text-orange-700"; }
        else { grade = "F - 不及格"; badgeColor = "bg-red-100 text-red-700"; }
        badge.textContent = grade;
        badge.className = `inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${badgeColor}`;

        // Summary
        document.getElementById("summary-text").textContent = data.summary;

        // Score bars
        const categories = ["grammar", "vocabulary", "structure", "content"];
        categories.forEach((cat) => {
            const catData = data[cat];
            const pct = (catData.score / 25) * 100;
            const bar = document.getElementById(`bar-${cat}`);
            bar.style.setProperty("--target-width", `${pct}%`);
            bar.style.width = `${pct}%`;
            document.getElementById(`score-${cat}`).textContent = `${catData.score}/25`;
        });

        // Store data for tabs
        window._gradingData = data;

        // Render first tab (grammar)
        switchTab("grammar");
    }

    // --- Render Focus Results ---
    function renderFocusResults(data) {
        document.getElementById("focus-area-label").textContent = data.focus_area;
        document.getElementById("focus-summary-text").textContent = data.summary;

        const perfectBadge = document.getElementById("focus-perfect-badge");
        const correctionsList = document.getElementById("focus-corrections-list");

        if (data.perfect) {
            perfectBadge.classList.remove("hidden");
            correctionsList.innerHTML = "";
        } else {
            perfectBadge.classList.add("hidden");
            let html = "";
            data.corrections.forEach((c) => {
                html += `
                <div class="correction-card bg-gray-50 rounded-lg p-4">
                    <div class="mb-2">
                        <span class="text-xs text-gray-400 uppercase tracking-wide">原文：</span>
                        <span class="original-text">${escapeHtml(c.original)}</span>
                    </div>
                    <div class="mb-2">
                        <span class="text-xs text-gray-400 uppercase tracking-wide">修改后：</span>
                        <span class="corrected-text">${escapeHtml(c.corrected)}</span>
                    </div>
                    <div class="text-sm text-gray-600">${escapeHtml(c.explanation)}</div>
                </div>`;
            });
            correctionsList.innerHTML = html;
        }
    }

    // --- Focus Grade Again ---
    document.getElementById("focus-grade-again-btn").addEventListener("click", () => {
        essayText.value = "";
        topicInput.value = "";
        essayType.value = "general";
        focusInput.value = "";
        updateCharCount();
        showSection(formSection);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // --- Tab Switching ---
    window.switchTab = function (category) {
        document.querySelectorAll(".tab-btn").forEach((btn) => {
            btn.classList.remove("text-blue-600", "border-blue-500");
            btn.classList.add("text-gray-500", "border-transparent");
        });

        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.remove("text-gray-500", "border-transparent");
            activeBtn.classList.add("text-blue-600", "border-blue-500");
        }

        const data = window._gradingData;
        if (!data) return;

        const catData = data[category];
        const container = document.getElementById("tab-contents");

        let html = "";

        // Strengths
        if (catData.strengths.length > 0) {
            html += `<h4 class="font-semibold text-green-700 mb-2">优点</h4><ul class="list-disc list-inside space-y-1 mb-4">`;
            catData.strengths.forEach((s) => {
                html += `<li class="text-gray-700 text-sm">${escapeHtml(s)}</li>`;
            });
            html += `</ul>`;
        }

        // Weaknesses
        if (catData.weaknesses.length > 0) {
            html += `<h4 class="font-semibold text-red-700 mb-2">待改进</h4><ul class="list-disc list-inside space-y-1 mb-4">`;
            catData.weaknesses.forEach((w) => {
                html += `<li class="text-gray-700 text-sm">${escapeHtml(w)}</li>`;
            });
            html += `</ul>`;
        }

        // Corrections
        if (catData.corrections && catData.corrections.length > 0) {
            html += `<h4 class="font-semibold text-blue-700 mb-3">具体纠正</h4>`;
            catData.corrections.forEach((c) => {
                html += `
                <div class="correction-card bg-gray-50 rounded-lg p-3 mb-3">
                    <div class="mb-1">
                        <span class="text-xs text-gray-400 uppercase tracking-wide">原文：</span>
                        <span class="original-text text-sm">${escapeHtml(c.original)}</span>
                    </div>
                    <div class="mb-1">
                        <span class="text-xs text-gray-400 uppercase tracking-wide">修改后：</span>
                        <span class="corrected-text text-sm">${escapeHtml(c.corrected)}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${escapeHtml(c.explanation)}</div>
                </div>`;
            });
        }

        // Suggestions
        if (catData.suggestions && catData.suggestions.length > 0) {
            html += `<h4 class="font-semibold text-purple-700 mb-2">建议</h4><ul class="list-disc list-inside space-y-1">`;
            catData.suggestions.forEach((s) => {
                html += `<li class="text-gray-700 text-sm">${escapeHtml(s)}</li>`;
            });
            html += `</ul>`;
        }

        container.innerHTML = html;
    };

    // --- Tab Click Delegation ---
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.category);
        });
    });

    // --- Retry / Grade Again ---
    retryBtn.addEventListener("click", () => {
        showSection(formSection);
    });

    gradeAgainBtn.addEventListener("click", () => {
        essayText.value = "";
        topicInput.value = "";
        essayType.value = "general";
        focusInput.value = "";
        updateCharCount();
        showSection(formSection);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // --- Escape HTML helper ---
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Initial state ---
    updateCharCount();
    showSection(formSection);
});
