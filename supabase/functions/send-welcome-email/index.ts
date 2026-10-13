const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// After Resend accepts the email, record it on the waitlist row.
// Never throws: a failed bookkeeping update must not hide a sent email.
async function markWaitlistSent(email: string, resendId?: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Cannot update waitlist: Supabase env vars missing");
    return;
  }
  const url = `${SUPABASE_URL}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}`;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer": "return=minimal",
  };
  try {
    let res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ email_sent: true, resend_id: resendId ?? null }),
    });
    if (!res.ok) {
      // Fall back in case the resend_id column does not exist.
      res = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ email_sent: true }),
      });
    }
    if (!res.ok) console.error("Waitlist update failed:", res.status, await res.text());
  } catch (err) {
    console.error("Waitlist update error:", (err as Error).message);
  }
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const email = payload?.record?.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email record in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sabbath <hello@getsabbath.com>",
        reply_to: "kreativbrillanz@gmail.com",
        to: [email],
        subject: "Welcome to Sabbath!",
        text: "Thanks for joining Sabbath! Sabbath is now available for Chrome: https://chromewebstore.google.com/detail/sabbath/jmjpbfooiappfacahjeidahibghhpklo  After installing, open the Sabbath icon, choose Settings, and set your work hours and any protected time.",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to Sabbath!</h2>
            <p>Thanks for joining. Sabbath is now available for Chrome, and it's free.</p>
            <p><a href="https://chromewebstore.google.com/detail/sabbath/jmjpbfooiappfacahjeidahibghhpklo" style="display:inline-block;background:#F59E0B;color:#1A1204;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;">Add Sabbath to Chrome</a></p>
            <p>After installing, click the Sabbath icon, open Settings, and choose your work hours and any protected time (like a quiet morning hour). Everything stays on your device.</p>
            <p>If you have any feedback, just reply to this email.</p>
          </div>
        `,
      }),
    });

    const resdata = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("Resend rejected the email:", JSON.stringify(resdata));
    } else {
      await markWaitlistSent(email, resdata?.id);
    }

    return new Response(JSON.stringify(resdata), {
      status: resendResponse.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


