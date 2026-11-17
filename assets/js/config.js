/* ==========================================================================
   Chris Digitals — public runtime configuration
   --------------------------------------------------------------------------
   This file is loaded in the browser, so it must only ever contain PUBLIC
   values. Nothing here is a secret: a Web3Forms access key is a public
   form identifier (it can only submit to the inbox it was created for),
   and the Calendly URL is a public booking page.

   NEVER put an SMTP password, a private API secret or a Google service
   account key in this file.
   ========================================================================== */

window.CD_CONFIG = {
  /* ---- Project enquiry form (Web3Forms) -------------------------------
     FORM_ENDPOINT is fixed. FORM_ACCESS_KEY is the one value you must add:
     go to https://web3forms.com, enter christopherbakare014@gmail.com,
     and paste the access key you receive by email into the quotes below.
     Until it is filled in, the form shows a clear "not configured" notice
     instead of pretending to send.                                        */
  FORM_ENDPOINT: "https://api.web3forms.com/submit",
  FORM_ACCESS_KEY: "",

  /* Where project enquiries are delivered (also used in error messages). */
  OWNER_EMAIL: "christopherbakare014@gmail.com",

  /* ---- Calendly booking ----------------------------------------------
     Public booking page. The brand query string themes the popup and the
     inline embed to the site's black-and-purple palette.                  */
  CALENDLY_URL: "https://calendly.com/christopherbakare26/30min",
  CALENDLY_BRAND:
    "background_color=05060b&text_color=f5f3ff&primary_color=7c5cff&hide_gdpr_banner=1"
};
