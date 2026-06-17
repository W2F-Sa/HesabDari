#!/usr/bin/env bash
# ============================================================================
#  نصب و راه‌اندازی کاملاً خودکار سامانه حسابداری و انبارداری GIoT
#  مخصوص Ubuntu 24.04 (و نسخه‌های مشابه)
#
#  استفاده:
#    chmod +x setup.sh
#    ./setup.sh            # نصب وابستگی‌ها + اجرای محیط توسعه
#    ./setup.sh build      # فقط ساخت نسخه‌ی نهایی (پوشه‌ی dist)
#    ./setup.sh serve      # ساخت + اجرای سرور تولید روی پورت 4173
# ============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}▶ ${NC}$1"; }
ok()   { echo -e "${GREEN}✔ ${NC}$1"; }
warn() { echo -e "${YELLOW}! ${NC}$1"; }
err()  { echo -e "${RED}✗ ${NC}$1" >&2; }

MODE="${1:-dev}"
NODE_MAJOR=20

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# ۱) بررسی و نصب پیش‌نیازها
# ---------------------------------------------------------------------------
log "بررسی پیش‌نیازهای سیستم (Ubuntu 24)…"

if ! command -v curl >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
  log "نصب curl و git و ابزارهای پایه…"
  sudo apt-get update -y
  sudo apt-get install -y curl git ca-certificates gnupg build-essential
fi

# نصب Node.js در صورت نبود یا قدیمی بودن
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  CUR_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  if [ "$CUR_MAJOR" -ge 18 ]; then
    NEED_NODE=0
    ok "Node.js نسخه‌ی $(node -v) موجود است."
  fi
fi

if [ "$NEED_NODE" -eq 1 ]; then
  log "نصب Node.js ${NODE_MAJOR}.x از مخزن رسمی NodeSource…"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
  ok "Node.js $(node -v) نصب شد."
fi

ok "npm نسخه‌ی $(npm -v)"

# ---------------------------------------------------------------------------
# ۲) نصب وابستگی‌های پروژه
# ---------------------------------------------------------------------------
log "نصب وابستگی‌های پروژه (npm install)…"
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi
ok "وابستگی‌ها نصب شدند."

# ---------------------------------------------------------------------------
# ۳) اجرا بر اساس حالت انتخابی
# ---------------------------------------------------------------------------
case "$MODE" in
  build)
    log "ساخت نسخه‌ی نهایی…"
    npm run build
    ok "نسخه‌ی نهایی در پوشه‌ی dist/ آماده شد."
    ;;
  serve)
    log "ساخت و اجرای سرور تولید…"
    npm run build
    ok "ساخت کامل شد. اجرای پیش‌نمایش روی http://localhost:4173"
    npm run preview -- --host --port 4173
    ;;
  dev|*)
    echo ""
    ok "همه‌چیز آماده است!"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  اطلاعات ورود پیش‌فرض:"
    echo -e "    نام کاربری: ${YELLOW}admin${NC}"
    echo -e "    رمز عبور:   ${YELLOW}K9m#Pt4xQ@2w${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "اجرای محیط توسعه روی http://localhost:5173 …"
    npm run dev -- --host
    ;;
esac
