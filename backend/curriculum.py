"""
Yojal 스페인어 20단계 커리큘럼
각 레벨: 단어 / 문법 / 문장패턴 / 관용표현 + 문제 15개 + 체크 5개
"""

CURRICULUM = {
    1: {
        "title": "기초 인사 & 자기소개",
        "vocab": ["hola(안녕)", "adiós(잘가)", "gracias(감사)", "sí(네)", "no(아니요)", "me llamo(내 이름은)"],
        "grammar": "ser 동사 현재형: soy / eres / es / somos / sois / son",
        "sentences": ["Hola, me llamo María.", "¿Cómo te llamas?", "Soy coreano/a.", "Mucho gusto."],
        "idioms": ["Mucho gusto (처음 뵙겠습니다)", "De nada (천만에요)"],
    },
    2: {
        "title": "숫자 & 기본 동사",
        "vocab": ["uno~diez(1-10)", "hablar(말하다)", "comer(먹다)", "vivir(살다)", "trabajar(일하다)", "estudiar(공부하다)"],
        "grammar": "-ar/-er/-ir 규칙동사 현재형 활용 (yo/tú/él 중심)",
        "sentences": ["Yo hablo español.", "¿Dónde vives?", "Ella come arroz.", "Estudio coreano."],
        "idioms": ["Más o menos (그저 그래요)", "Claro que sí (물론이죠)"],
    },
    3: {
        "title": "명사 & 관사",
        "vocab": ["el/la(정관사)", "un/una(부정관사)", "casa(집)", "libro(책)", "agua(물)", "comida(음식)"],
        "grammar": "명사 성(남성/여성) 구별: -o → 남성, -a → 여성 (예외 포함)",
        "sentences": ["El libro es interesante.", "Una casa grande.", "El agua está fría.", "Tengo un libro."],
        "idioms": ["¡Qué bien! (잘됐다!)", "¡Qué malo! (안됐다!)"],
    },
    4: {
        "title": "형용사 & 성수일치",
        "vocab": ["grande(큰)", "pequeño(작은)", "bueno(좋은)", "malo(나쁜)", "bonito(예쁜)", "feo(못생긴)"],
        "grammar": "형용사 성수일치: bueno→buena / buenos→buenas",
        "sentences": ["Una casa bonita.", "Libros interesantes.", "Mi amigo es alto.", "Ella es simpática."],
        "idioms": ["¡Qué bonito! (얼마나 예뻐!)", "Más o menos (그럭저럭)"],
    },
    5: {
        "title": "소유형용사",
        "vocab": ["mi(나의)", "tu(너의)", "su(그/그녀의)", "nuestro(우리의)", "vuestro(너희의)", "su(그들의)"],
        "grammar": "소유형용사 성수일치: mi casa / mis casas / nuestro amigo / nuestra amiga",
        "sentences": ["Mi casa es grande.", "Nuestro amigo viene.", "Sus libros son interesantes.", "Tu español es bueno."],
        "idioms": ["A tu salud (건배)", "De tu parte (너 대신에)"],
    },
    6: {
        "title": "의문문 & 부정문",
        "vocab": ["qué(무엇)", "dónde(어디)", "cuándo(언제)", "cómo(어떻게)", "por qué(왜)", "cuánto(얼마나)"],
        "grammar": "의문문: ¿...? / 부정문: no + 동사 / hay vs estar",
        "sentences": ["¿Dónde está la estación?", "No entiendo.", "¿Por qué estudias español?", "¿Cuánto cuesta?"],
        "idioms": ["No hay problema (문제없어요)", "¿Qué tal? (어떻게 지내?)"],
    },
    7: {
        "title": "불규칙 동사 핵심",
        "vocab": ["ir(가다)", "tener(가지다)", "hacer(하다)", "querer(원하다)", "poder(할 수 있다)", "venir(오다)"],
        "grammar": "불규칙 현재형: ir→voy, tener→tengo, hacer→hago, querer→quiero",
        "sentences": ["Voy al mercado.", "Tengo hambre.", "¿Qué haces?", "Quiero aprender español."],
        "idioms": ["Tener ganas de (하고 싶다)", "Hacer falta (필요하다)"],
    },
    8: {
        "title": "전치사 & 목적격 a",
        "vocab": ["en(~에)", "de(~의)", "a(~에/~를)", "con(~와)", "para(~를 위해)", "por(~때문에)"],
        "grammar": "인칭목적격 a: Veo a mi amigo / hay + 무관사: Hay trabajo / al = a + el",
        "sentences": ["Voy a la tienda.", "Hablo con mi amigo.", "Lo hago para ti.", "Hay personas aquí."],
        "idioms": ["De vez en cuando (때때로)", "Por supuesto (물론)"],
    },
    9: {
        "title": "목적어 대명사",
        "vocab": ["me(나를)", "te(너를)", "lo/la(그것을)", "nos(우리를)", "os(너희를)", "los/las(그것들을)"],
        "grammar": "직접목적어 대명사 위치: 동사 앞 / Lo veo. / Te quiero. / Me llama.",
        "sentences": ["Te llamo mañana.", "Lo veo todos los días.", "¿Me entiendes?", "Nos ayuda mucho."],
        "idioms": ["Te lo juro (맹세해)", "Me da igual (상관없어)"],
    },
    10: {
        "title": "과거형 기초 (규칙)",
        "vocab": ["ayer(어제)", "anteayer(그저께)", "la semana pasada(지난주)", "el año pasado(작년)", "antes(전에)", "ya(이미)"],
        "grammar": "pretérito indefinido 규칙: -ar→é/aste/ó, -er/-ir→í/iste/ió",
        "sentences": ["Ayer comí arroz.", "Hablé con ella.", "Fui a la tienda.", "Compré comida."],
        "idioms": ["¡Ya era hora! (이제야!)", "Al final (결국)"],
    },
    11: {
        "title": "과거형 불규칙",
        "vocab": ["fui(갔다/였다)", "tuve(가졌다)", "hice(했다)", "vine(왔다)", "puse(놓았다)", "quise(원했다)"],
        "grammar": "pretérito indefinido 불규칙: ir/ser→fui, tener→tuve, hacer→hice, venir→vine",
        "sentences": ["Fui al cine.", "Tuve mucho trabajo.", "Hice ejercicio.", "Vine en metro."],
        "idioms": ["Fue un placer (만나서 반가웠어요)", "No pudo ser (어쩔 수 없었어요)"],
    },
    12: {
        "title": "과거진행 (imperfecto)",
        "vocab": ["siempre(항상)", "normalmente(보통)", "antes(예전에)", "de niño(어릴 때)", "todos los días(매일)", "a veces(때때로)"],
        "grammar": "imperfecto: -ar→aba/abas/aba, -er/-ir→ía/ías/ía / 습관·묘사 표현",
        "sentences": ["Cuando era niño, jugaba mucho.", "Antes vivía en Seúl.", "Siempre comía arroz.", "Llovía mucho."],
        "idioms": ["En aquella época (그 시절에는)", "Como siempre (항상 그렇듯이)"],
    },
    13: {
        "title": "미래형",
        "vocab": ["mañana(내일)", "la próxima semana(다음주)", "el próximo año(내년)", "pronto(곧)", "algún día(언젠가)", "después(나중에)"],
        "grammar": "futuro simple: 원형+é/ás/á/emos/éis/án / 불규칙: ir→iré, tener→tendré",
        "sentences": ["Mañana iré al trabajo.", "Tendré una reunión.", "¿Qué harás?", "Aprenderé más español."],
        "idioms": ["A partir de ahora (이제부터)", "En el futuro (미래에)"],
    },
    14: {
        "title": "조건법",
        "vocab": ["me gustaría(~하고 싶다)", "podría(할 수 있을 텐데)", "debería(해야 할 텐데)", "querría(원할 텐데)", "sería(일 텐데)", "tendría(가질 텐데)"],
        "grammar": "condicional: 원형+ía/ías/ía / 공손한 요청: ¿Podría...? / 가정: Si tuviera...",
        "sentences": ["Me gustaría ir a España.", "¿Podría ayudarme?", "Debería estudiar más.", "Si pudiera, viajaría."],
        "idioms": ["Me gustaría saber (알고 싶어요)", "¿Le importaría...? (괜찮으시다면...)"],
    },
    15: {
        "title": "재귀동사",
        "vocab": ["levantarse(일어나다)", "acostarse(눕다)", "llamarse(불리다)", "sentirse(느끼다)", "ponerse(되다)", "quedarse(머물다)"],
        "grammar": "재귀대명사: me/te/se/nos/os/se + 재귀동사 / 일상루틴 표현",
        "sentences": ["Me levanto a las 7.", "¿Cómo te llamas?", "Se siente bien.", "Nos quedamos en casa."],
        "idioms": ["Ponerse de acuerdo (합의하다)", "Quedarse sin palabras (말문이 막히다)"],
    },
    16: {
        "title": "접속사 & 복문",
        "vocab": ["porque(왜냐하면)", "aunque(비록~지만)", "cuando(~할 때)", "si(만약)", "para que(~하기 위해)", "mientras(~하는 동안)"],
        "grammar": "복문 구조: 접속사 + 절 / aunque + 직설법·접속법 차이",
        "sentences": ["Estudio porque quiero hablar bien.", "Aunque llueve, salgo.", "Cuando llegues, llámame.", "Si quieres, ven."],
        "idioms": ["Sin embargo (그럼에도 불구하고)", "A pesar de (에도 불구하고)"],
    },
    17: {
        "title": "접속법 기초 (subjuntivo)",
        "vocab": ["espero que(바라건대)", "quiero que(원한다)", "es importante que(중요하다)", "ojalá(바라건대)", "tal vez(아마도)", "quizás(어쩌면)"],
        "grammar": "subjuntivo presente 형성: yo형에서 반대모음 / querer que + 주어 변화 필수",
        "sentences": ["Espero que vengas.", "Quiero que estudies.", "Es importante que lo hagas.", "Ojalá llueva."],
        "idioms": ["Ojalá que sí (그랬으면 좋겠어)", "Que te vaya bien (잘 되길 바라)"],
    },
    18: {
        "title": "관용표현 & 숙어",
        "vocab": ["tener en cuenta(고려하다)", "dar a luz(출산하다)", "echar de menos(그리워하다)", "hacerse cargo(담당하다)", "llevar a cabo(수행하다)", "tomar en serio(진지하게 받아들이다)"],
        "grammar": "동사구 관용표현 / 전치사 고정 표현 / 문맥별 의미 차이",
        "sentences": ["Tengo en cuenta tu opinión.", "Echo de menos a mi familia.", "Llevaremos a cabo el plan.", "Tómalo en serio."],
        "idioms": ["No hay mal que por bien no venga (전화위복)", "Camarón que se duerme, se lo lleva la corriente (방심하면 안 돼)"],
    },
    19: {
        "title": "고급 문법 종합",
        "vocab": ["sin que(~없이)", "a menos que(~하지 않는 한)", "con tal de que(~하는 조건으로)", "antes de que(~하기 전에)", "después de que(~한 후에)", "para que(~하도록)"],
        "grammar": "접속법 과거 (subjuntivo imperfecto) / si절 가정법 종합 / 수동태",
        "sentences": ["Si hubiera sabido, habría venido.", "Aunque lo supiera, no diría nada.", "El libro fue escrito por él.", "Quería que lo hicieras."],
        "idioms": ["Ni que decir tiene (말할 필요도 없다)", "Valga la redundancia (겹치는 말이지만)"],
    },
    20: {
        "title": "고급 자유 표현",
        "vocab": ["matiz(뉘앙스)", "en definitiva(결국)", "cabe destacar(주목할 만하다)", "sin duda(의심할 여지 없이)", "a grandes rasgos(대략적으로)", "en resumidas cuentas(요약하자면)"],
        "grammar": "뉘앙스별 시제 선택 / 격식체 vs 비격식체 / 고급 접속사 활용",
        "sentences": ["Cabe destacar que el proyecto fue exitoso.", "En definitiva, depende de ti.", "Sin duda, es la mejor opción.", "A grandes rasgos, el plan es viable."],
        "idioms": ["Al pie de la letra (글자 그대로)", "Entre líneas (행간을 읽다)", "Dar en el clavo (핵심을 찌르다)"],
    },
}


def get_level_prompt(level: int, day: int) -> str:
    c = CURRICULUM.get(level, CURRICULUM[1])
    next_level = min(level + 1, 20)

    verb = c["vocab"][1] if len(c["vocab"]) > 1 else c["vocab"][0]
    noun = c["vocab"][2] if len(c["vocab"]) > 2 else c["vocab"][0]

    return f"""당신은 Yojal, 한국인을 위한 스페인어 AI 선생님입니다.

학생 레벨: {level}단계 ({c['title']}) / {day}일차

다음 형식으로 수업하세요. 이 형식을 정확히 따르세요:

📅 {day}일차 — 레벨 {level:02d} → {next_level:02d} 도전

━━━ 오늘 배울 것 ━━━

🔤 동사: {verb}
  활용) {c['grammar']}
  예문 1)
  [스페인어 예문]
  ([한국어 해석])
  예문 2)
  [스페인어 예문]
  ([한국어 해석])

📝 단어: {noun}
  예문 1)
  [스페인어 예문]
  ([한국어 해석])
  예문 2)
  [스페인어 예문]
  ([한국어 해석])

📌 문법 포인트
  {c['grammar']}

━━━ 문제 5개 ━━━
한국어 → 스페인어. 번호 붙여서 제시.

━━━ 체크 3개 ━━━
O/X 또는 빈칸으로 핵심 확인.

출력 형식 규칙:
- 설명·해석은 반드시 한국어로만 작성 (중국어 절대 금지)
- 스페인어와 한국어 해석은 반드시 줄바꿈으로 구분
- 교정: ⚠️ 내 답: xxx\\n정답: xxx ✓\\n설명: ...
- 학생이 답하면 즉시 교정 후 다음으로 진행
- 응원하는 톤 유지"""
