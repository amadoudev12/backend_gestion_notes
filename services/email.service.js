const {resend} = require('../lib/resend')
const sendLoginEmail = async ({
    email,
    nom,
    identifiant,
    motDePasse
}) => {

    const loginUrl = "https://tonsite.com/login";

    const html = `
        <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <div style="background:#2563eb;padding:25px;text-align:center;color:#fff;">
            <h2 style="margin:0;">SuperNova School</h2>
            <p style="margin-top:8px;">Plateforme de gestion scolaire</p>
            </div>

            <!-- BODY -->
            <div style="padding:30px;">

            <h3 style="color:#1e293b;">Bonjour ${nom},</h3>

            <p style="color:#475569;line-height:1.6;">
                Votre compte a été créé avec succès sur la plateforme scolaire.
                Vous pouvez maintenant vous connecter avec les informations ci-dessous.
            </p>

            <!-- INFOS -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:25px 0;">

                <p style="margin:0 0 10px;">
                <strong>Identifiant :</strong> ${identifiant}
                </p>

                <p style="margin:0;">
                <strong>Mot de passe :</strong> ${motDePasse}
                </p>

            </div>

            <!-- BUTTON -->
            <div style="text-align:center;margin:30px 0;">
                <a href="${loginUrl}" style="
                    background:#2563eb;
                    color:#fff;
                    padding:14px 26px;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                    display:inline-block;
                ">
                Se connecter
                </a>
            </div>

            <p style="color:#64748b;font-size:14px;line-height:1.6;">
                ⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe après votre première connexion.
            <!--
<p style="margin-top:30px;color:#475569;">
    Cordialement,<br/>
    <strong>L’équipe SuperNova School</strong>
</p>
-->

            </div>

            <!-- FOOTER -->
            <div style="background:#f8fafc;padding:15px;text-align:center;font-size:12px;color:#94a3b8;">
            © 2026 Note flow Tous droits réservés
            </div>

        </div>
        </div>
    `;

    const result = await resend.emails.send({
            from: "delhadjamadou670@gmail.com",
            to: email,
            subject: "Vos informations de connexion",
            html
        });
        return result;

    } catch (error) {
        console.log("Erreur envoi email:", error);
        throw new Error("Email non envoyé");
    }
};

module.exports = sendLoginEmail