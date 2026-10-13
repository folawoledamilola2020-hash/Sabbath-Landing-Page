const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
        from: "Sabbath <onboarding@resend.dev>",
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


