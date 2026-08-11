# Template Supabase — Confirm sign up

## Subject

Confirmez votre inscription — La Pièce d’Après

## Body HTML

```html
<h2 style="font-family:Georgia,serif;color:#5A3828;margin-bottom:8px;">
  Confirmez votre inscription
</h2>

<p style="font-family:Arial,sans-serif;color:#211B18;font-size:15px;line-height:1.6;">
  Bonjour,<br><br>
  Merci de créer votre compte sur <strong>La Pièce d’Après</strong>.
</p>

<p style="font-family:Arial,sans-serif;color:#211B18;font-size:15px;line-height:1.6;">
  Votre code de confirmation est :
</p>

<p style="font-family:Arial,sans-serif;font-size:28px;font-weight:bold;letter-spacing:6px;color:#5A3828;margin:20px 0;">
  {{ .Token }}
</p>

<p style="font-family:Arial,sans-serif;color:#211B18;font-size:15px;line-height:1.6;">
  Ouvrez la page ci-dessous, saisissez votre adresse e-mail puis ce code :
</p>

<p style="margin:24px 0;">
  <a href="{{ .SiteURL }}/auth/confirm-signup"
     style="background-color:#B96E3F;color:#FBF8F3;padding:12px 24px;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold;display:inline-block;">
    Confirmer mon inscription
  </a>
</p>

<p style="font-family:Arial,sans-serif;color:#7C806C;font-size:13px;line-height:1.6;">
  Si le bouton ne s’ouvre pas, rendez-vous simplement sur :<br>
  {{ .SiteURL }}/auth/confirm-signup
</p>

<p style="font-family:Arial,sans-serif;color:#7C806C;font-size:12px;line-height:1.5;">
  Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail.
</p>
```
