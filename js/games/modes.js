/* Режими на игрите: едно действие = едно заглавие за детето + mode_id (канонична операция) + посока.
   Методист, 17.10.2026 (одит на Читарика). Шаблонът (game_template_id) остава само справка; детето вижда заглавието на режима,
   а всяко събитие записва mode_id, view_name и direction. Режимът се избира от: this.view (Текст, История, Подреди по ред,
   Интонация), иначе от нивото (this.level / settings.level). Банковите изгледи на Букварика (bankGame.js) имат своя таблица.
   tools/homework_map.py чете този файл (JSON между маркерите) за заглавията в картата на домашните – не пиши код между тях.
   Четвърти елемент "combined" = статусът за целевото умение изисква наблюдение (OBS) на възрастен: устно изпълнение, драматизация
   или собствен продукт. Автоматичните стъпки са поддържащи данни; без OBS статусът е „няма достатъчно наблюдение“, не отрицателен.
   Същото важи за режим с settings.retell (преразказ пред възрастен). */
window.GAME_MODES = /*MODES*/{
  "constructor": { "by": "level", "def": "1", "modes": {
    "1": ["Намери сричката", "find_syllable", "read_to_read"],
    "2": ["Сглоби думата", "build_word", "sound_to_written"],
    "3": ["Намери думата", "find_word", "read_to_read"],
    "4": ["Намери думата", "find_word", "read_to_read"] } },
  "wordOrder": { "by": "level", "def": "1", "modes": {
    "1": ["Подреди сричките", "syllable_order", "order_syllables"],
    "2": ["Подреди сричките", "syllable_order", "order_syllables"],
    "3": ["Подреди буквите", "letter_order", "order_letters"],
    "4": ["Поправи грешката", "fix_error", "read_to_fix"],
    "5": ["Поправи грешките", "fix_multiple_errors", "read_to_fix"] } },
  "trueWords": { "by": "level", "def": "1", "modes": {
    "1": ["Коя дума е за картинката?", "word_to_picture", "picture_to_word"],
    "2": ["Коя дума е написана правилно?", "correct_spelling", "picture_to_word"] } },
  "conformity": { "by": "level", "def": "1", "modes": {
    "1": ["Коя картинка отговаря?", "sentence_picture", "read_to_picture"],
    "2": ["Кое изречение отговаря?", "picture_to_sentence", "picture_to_read"] } },
  "words": { "by": "level", "def": "1", "modes": {
    "1": ["Каква е думата?", "semantic_word_class", "read_to_category"],
    "2": ["Към кой въпрос?", "word_group", "read_to_category"],
    "3": ["Кой е или какво е?", "who_or_what", "read_to_category"] } },
  "sayDifferently": { "by": "level", "def": "1", "modes": {
    "1": ["Същото значение", "synonym", "read_to_read"],
    "2": ["Противоположното", "antonym", "read_to_read"] } },
  "accents": { "by": null, "def": "", "modes": { "": ["Ударения", "word_stress", "read_to_sound"] } },
  "buildSentence": { "by": null, "def": "", "modes": { "": ["Построй изречение", "sentence_building", "order_words"] } },
  "sequence": { "by": "view", "def": "sentences", "modes": {
    "sentences": ["Подреди изреченията", "sequence_sentences", "read_to_order"],
    "pictures": ["Подреди картинките", "sequence_pictures", "picture_to_order", "combined"] } },
  "intonation": { "by": "view", "def": "purpose", "modes": {
    "purpose": ["Казвам, питам, възкликвам", "communicative_purpose", "read_to_sign"],
    "scene": ["Чета като герой", "role_intonation", "read_to_voice", "combined"] } },
  "text": { "by": "view", "def": "question_evidence", "modes": {
    "question_evidence": ["Отговори и покажи", "answer_with_evidence", "read_to_answer"],
    "find_evidence": ["Намери в текста", "find_evidence", "read_to_answer"],
    "title": ["Дай заглавие", "choose_title", "read_to_title"],
    "title_question": ["Заглавие и въпроси", "title_and_questions", "read_to_answer"],
    "keywords": ["Ключови думи", "key_words", "read_to_words"],
    "ask_question": ["Задай въпрос", "ask_question", "build_question"] } },
  "editSentence": { "by": null, "def": "", "modes": { "": ["Поправи изречението", "edit_sentence", "read_to_fix"] } },
  "conventions": { "by": null, "def": "", "modes": { "": ["Направи изречението ясно", "sentence_conventions", "read_to_fix"] } },
  "wordContext": { "by": null, "def": "", "modes": { "": ["Коя дума е най-точна?", "word_in_context", "read_to_word"] } },
  "sorting": { "by": "task", "def": "classify", "modes": {
    "classify": ["Къде отива?", "world_classify", "picture_to_category"],
    "cause": ["Помага ли? Защо?", "world_cause", "picture_to_cause"],
    "action": ["Какво ще направиш?", "world_action", "situation_to_action"],
    "sequence": ["Подреди какво става", "world_sequence", "picture_to_order"],
    "explain": ["Кое обяснение е вярно?", "world_explain", "picture_to_explanation"],
    "identify_respect": ["Познай и покажи уважение", "world_identify_respect", "picture_to_symbol", "combined"],
    "judge_polite": ["Учтиво ли е?", "world_judge_polite", "picture_to_category"],
    "who_does": ["Кой го прави?", "world_who_does", "picture_to_category"],
    "choose_helper": ["Кой ще помогне?", "world_choose_helper", "situation_to_helper"],
    "choose_sense": ["С кое сетиво?", "world_choose_sense", "situation_to_sense"],
    "order_days": ["Подреди по дните", "world_order_days", "picture_to_order"],
    "choose_season": ["Кога става това?", "world_choose_season", "picture_to_category"],
    "food_source": ["От кое растение е?", "world_food_source", "picture_to_source"],
    "animal_winter": ["Какво прави през зимата?", "world_animal_winter", "picture_to_category"],
    "find_young": ["Как се казва малкото?", "world_find_young", "picture_to_name"],
    "is_needed": ["Нужно ли е?", "world_is_needed", "picture_to_category"],
    "whose_holiday": ["Кой празнува?", "world_whose_holiday", "picture_to_category"],
    "name_emotion": ["Как се чувства?", "world_name_emotion", "picture_to_emotion"],
    "emotion_cause": ["Как се чувства и защо?", "world_emotion_cause", "picture_to_cause"] } },
  "cleanShipRoom": { "by": "", "def": "sort", "modes": { "sort": ["Къде е мястото му?", "room_sort", "picture_to_category"] } },
  "patterns": { "by": "", "def": "next", "modes": { "next": ["Какво следва?", "pattern_next", "picture_to_picture"] } },
  "subitize": { "by": "", "def": "glance", "modes": { "glance": ["Колко са?", "subitize_glance", "picture_to_number"] } },
  "pirateCipher": { "by": "", "def": "place", "modes": { "place": ["Къде да го сложа?", "garden_place", "word_to_position"] } },
  "lines": { "by": "view", "def": "line_kind", "modes": {
    "line_kind": ["Права или крива?", "line_kind", "picture_to_category"],
    "compare": ["Сравни и покажи", "compare_size", "word_to_picture"],
    "measure": ["Измери", "measure_units", "picture_to_number"],
    "measure_check": ["Кое е измерено правилно?", "measure_check", "picture_to_picture"] } },
  "shapes": { "by": "view", "def": "find_shape", "modes": {
    "find_shape": ["Намери фигурата", "shape_find", "word_to_picture"],
    "compose": ["Коя фигура липсва?", "shape_compose", "picture_to_picture"],
    "real_shape": ["На коя фигура прилича?", "shape_real_object", "picture_to_picture"] } },
  "gridDictation": { "by": "", "def": "follow", "modes": { "follow": ["Следвай стрелките", "grid_dictation", "command_to_position"] } },
  "story": { "by": "view", "def": "quiz", "modes": {
    "read_order4": ["Подреди историята", "story_order", "read_to_order"],
    "quiz": ["Разбирам историята", "story_comprehension", "read_to_answer"],
    "order4_pics": ["Подреди историята", "story_order", "picture_to_order"],
    "order5": ["Подреди историята", "story_order", "picture_to_order"],
    "lines": ["Кой го каза?", "speaker_lines", "read_to_speaker"],
    "structure": ["Части на историята", "story_structure", "read_to_category"],
    "create": ["Създай история", "story_create", "create", "combined"],
    "book": ["Кулата на историите", "story_book", "create", "combined"] } }
}/*END*/;
