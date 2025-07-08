export async function setLanguageAndLocale(language, locale) {
  await browser.execute('mobile: configureLocalization', {
    language: { name: language },
    locale: { name: locale },
  });
}
