# Template Supabase — Reset Password

Dans Supabase : **Authentication → Emails → Reset Password**.

L'objectif est volontairement de **ne mettre aucun lien cliquable** dans cet e-mail.
Brevo peut donc suivre les ouvertures/clics sans pouvoir casser le parcours de récupération.

## Subject

```text
{{ .Token }} — Réinitialiser votre mot de passe | La Pièce d’Après
```

## Body HTML

```html
<div style="font-family:Arial,sans-serif;background:#F7F1E5;padding:32px;color:#211B18;">
  <div style="max-width:560px;margin:0 auto;background:#FBF8F3;border-radius:18px;padding:32px;">
    <p style="margin:0 0 8px;color:#B96E3F;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">La Pièce d’Après</p>
    <h2 style="font-family:Georgia,serif;color:#5A3828;font-size:30px;margin:0 0 16px;">Réinitialiser votre mot de passe</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 22px;">Saisissez ce code directement dans l’application :</p>
    <div style="font-size:34px;letter-spacing:8px;font-weight:700;text-align:center;background:#EFE3D2;border-radius:12px;padding:18px;color:#5A3828;">{{ .Token }}</div>
    <p style="font-size:13px;line-height:1.6;color:#7C806C;margin:22px 0 0;">Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.</p>
  </div>
</div>
```

Ne pas utiliser `{{ .ConfirmationURL }}` dans ce template.
