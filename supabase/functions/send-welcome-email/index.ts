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
        to: [email],
        subject: "Welcome to Sabbath!",
        text: "Thanks for joining the Sabbath waitlist! We are excited to have you on board.",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to Sabbath!</h2>
            <p>Thanks for joining our waitlist. We're excited to have you on board!</p>
            <p>We'll notify you as soon as early access opens up.</p>
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


