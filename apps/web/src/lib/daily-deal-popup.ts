/** Session keys shared by the early boot script and `ExitIntentPopup`. */
export const DAILY_DEAL_SHOWN_KEY = "blossompot_daily_deal_shown_v20";
export const DAILY_DEAL_TIMER_KEY = "blossompot_daily_deal_timer_v20";

/** Delay after the first eligible page parse before the wheel may open. */
export const DAILY_DEAL_SHOW_AFTER_MS = 1_500;

/**
 * Records the wait start during HTML parse, before React hydration.
 * Does not open the popup. The React effect still applies route, session,
 * and delivery-selector rules before showing it.
 */
export const DAILY_DEAL_TIMER_BOOT_SCRIPT = `(function(){try{var p=location.pathname;if(p.indexOf("/admin")===0||p.indexOf("/ses-email")===0||p.indexOf("/checkout")===0)return;var shown=${JSON.stringify(DAILY_DEAL_SHOWN_KEY)};var timer=${JSON.stringify(DAILY_DEAL_TIMER_KEY)};if(sessionStorage.getItem(shown))return;if(!sessionStorage.getItem(timer))sessionStorage.setItem(timer,String(Date.now()));}catch(e){}})();`;
