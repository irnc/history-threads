# Зыходнікі

- `src/`

Кожны файл зыходніка апісвае рэсурс. З гэтага апісання праз прылады выбудоўваецца некалькі тыпаў старонак:

- `resources` непасрэдка старонкі кожнага рэсурса
- `threads` старонкі ніцей, якія зводзяць рэсурсы
- `updates` старонка з пералікам змен апісання рэсурса

## Фармат YAML

`resource` захоўваецца як масіў каб дазволіць пазначать кантэнт разпаўсюджаны праз розные крыніцы.

## Імпарт

Фотакарткі з archiwum.allegro.pl

`yarn thread-allegro-archiwum https://archiwum.allegro.pl/oferta/gen-f-kleeberg-szkola-podof-29-pap-grodno-i7611417798.html`

## Зрабіць

- праіндэксіраваць
  - http://oldgrodno.by/
  - https://forum.grodno.net/index.php?topic=139550.4800

# Дадзеные

- `npm run build-website-index-from-src`
  - прачытае ўсе зыходнікі з `src/`
  - перабудуе індэкс з зыходнікаў па ніцях (уласцівасці `threads`)
  - запіша ніці як дадзеныя ў `website/data/threads/`
  - запіша ніці як кантэнт у `website/content/index/`
    - гэты кантэнт працуе праз шаблон `website/layouts/index/single.html`

# Прагляд

- `(cd website && hugo server)`

# Распрацоўка

- [`brew install hugo`](https://gohugo.io/getting-started/installing/)
- `(cd website && hugo server)`
