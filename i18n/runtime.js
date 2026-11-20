/* The Mana Paradox — bilingual runtime layer.
 * Injected ahead of the game bundle by i18n/translate-plugin.js.
 * - __MP_T(en, zh) selects the active language for build-time literals.
 * - DOM text/attributes, native dialogs and composed strings follow suit.
 * - English mode is fully transparent (no DOM rewriting, no dialog/title changes).
 * - Injects a language switcher into the Options page at runtime.
 */
(function () {
    'use strict';
    if (window.__MANA_PARADOX_I18N__) return;
    window.__MANA_PARADOX_I18N__ = true;

    var LANG_KEY = 'mana-paradox-language';
    function readLang() {
        try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh'; }
        catch (e) { return 'zh'; }
    }
    var lang = readLang();
    function isEnglish() { return lang === 'en'; }

    var stats = { textNodes: 0, attributes: 0, dialogs: 0, rules: 0, language: lang };

    // Build-time selector. Both languages live in the bundle; this just picks one.
    var __MP_T = function (en, zh) { return isEnglish() ? en : zh; };
    window.__MP_T = __MP_T;
    window.__mpLanguage = function () { return lang; };

    // Regex rules for strings assembled at runtime (exact literals are handled
    // at build time by __MP_T). Only applied in Chinese mode.
    var RULES = [
        [/^You gained (a|\d+) memor(?:y|ies)! \(([^)]*)\)$/, function (m) {
            return '你获得了 ' + (m[1] === 'a' ? '1' : m[1]) + ' 点记忆！（' + m[2] + '）';
        }],
        [/^([\d.,]+) coins · ([\d.,]+) coin(?:s)? \/ (\d+) min$/, '$1 金币 · 每 $3 分钟 $2 金币'],
        [/^Cost: (.+) mana$/, '消耗：$1 魔力'],
        [/^Reward: ([\d.,]+) coins$/, '奖励：$1 金币'],
        [/^Reward: Mana is increased based on time played \(Currently: (.+)\)$/, '奖励：魔力随游戏时长提升（当前：$1）'],
        [/^Achievement: (.*)$/, '成就：$1'],
        [/^Achievements?: (.*)$/, '成就：$1'],
        [/^Tier (\d+): Cannot perform this task$/, '第 $1 阶：无法执行此任务'],
        [/^Tier (\d+): (.*)$/, '第 $1 阶：$2'],
        [/^Minimum required: Tier (\d+)$/, '最低要求：第 $1 阶'],
        [/^Minimum required: Tier (\d+)([\s\S]*)$/, function (m) { return '最低要求：第 ' + m[1] + ' 阶' + m[2]; }],
        [/^Tier (\d+): Cannot perform this task([\s\S]*)$/, function (m) {
            return '第 ' + m[1] + ' 阶：无法执行此任务' + m[2];
        }],
        [/^Percentage to (.*)$/, '达成「$1」的进度'],
        [/^Reward: (.*)$/, '奖励：$1'],
        [/^Rewards:$/, '奖励：'],
        [/^Effects:$/, '效果：'],
        [/^Goal:$/, '目标：'],
        [/^Crystal (\d+)(, locked)?$/, function (m) { return '水晶 ' + m[1] + (m[2] ? '（未解锁）' : ''); }],
        [/^You have cast this (\d+) times?$/, '你已施放此 $1 次'],
        [/^Running in (.*)$/, '进行中，剩余 $1'],
        [/^Wage due in (.*)$/, '工资到期：剩余 $1'],
        [/^No wage due$/, '暂无到期工资'],
        [/^Package: (.*)$/, '礼包：$1'],
        [/^Contains 10 of (.*)$/, '包含 10 个 $1'],
        [/^for an ([\d.]+)% chance$/, '有 $1% 的概率'],
        [/^for ([\d.,e+]+) condensed mana$/, '获得 $1 凝结魔力'],
        [/^Mana production is raised \^(\S+)$/, '魔力产量提升至 ^$1'],
        [/^Game speed is divided by (\S+)$/, '游戏速度除以 $1'],
        [/^Meditation Power is raised \^(\S+)$/, '冥想力量提升至 ^$1'],
        [/^Reach ([\d.,e+]+) Mana$/, '达到 $1 魔力'],
        [/^Potion of Speed: \+(.*)× Game Speed \((.*)\)$/, '速度药水：+$1× 游戏速度（$2）'],
        [/^Arrow (Up|Down|Left|Right)$/, function (m) {
            return '方向键' + { Up: '上', Down: '下', Left: '左', Right: '右' }[m[1]];
        }],
        [/^Save data (.*)$/, '存档数据 $1'],
        [/^The Mana Paradox v(.*)$/, '魔力悖论 v$1'],
        [/^Unknown achievement(.*)$/, '未知成就$1'],
        [/^Achievement from a future mana circle$/, '来自未来魔力圈的成就'],
        [/^Cost: (.+)$/, '消耗：$1'],
        [/^Mana Per Second: (.+)$/, '每秒魔力：$1'],
        [/^Current Game Speed: (.+)$/, '当前游戏速度：$1'],
        [/^([\d.,e+]+) owned$/, '$1 已拥有'],
        [/^([\d.,e+]+) mana$/, '$1 魔力'],
        [/^Crystal Matrices: (.+) \(([^)]*)\)$/, '水晶矩阵：$1（$2）'],
        [/^Sealed Meridians: (.+) \(([^)]*)\)$/, '封印子午线：$1（$2）'],
        [/^Reach: (.+) Meridians$/, '需要：$1 条子午线'],
        [/^Requires (.+) Mana Absorbers$/, '需要 $1 个魔力吸收器'],
        [/^(\S+) All Production$/, '$1 全产量'],
        [/^(\S+) Game Speed · Ready$/, '$1 游戏速度 · 就绪'],
        [/^(\S+) Meditation Magnitude$/, '$1 冥想强度'],
        [/^\+([\d.]+) Meditation Power$/, '+$1 冥想力量'],
        [/^Resets everything beforehand$/, '此前会重置所有进度'],
        [/^\(Consumes all producers before Meridians\)$/, '（消耗子午线之前的所有生产器）'],
        [/^I must work up the courage\.\. to get stronger!$/, '我必须鼓起勇气……变得更强！'],
        [/^Use the (.*) tool$/, '使用$1工具'],
        [/^Cannot perform this task$/, '无法执行此任务'],
        [/^Tier (\d+)\+$/, '第 $1 阶以上'],
        [/^Tier (\d+)\+ (.+)$/, '第 $1 阶以上 · $2'],
        [/^([\d.,]+) coins · ([\d.,]+) coins \/ (\d+) min$/, '$1 金币 · 每 $3 分钟 $2 金币'],
        [/^100 quindecillion mana is a lot \((\d+)\)$/, '一百万亿亿魔力可真不少（$1）'],
        [/^(奖励：.*) coins$/, '$1 金币'],
        [/^(奖励：.*) Mana is increased based on time played \(Currently: (.+)\)$/, '$1魔力随游戏时长提升（当前：×$2）'],
        [/^Hire Tier (\d+)$/, '雇佣第 $1 阶'],
        [/^Divides mana by (.+)$/, '魔力除以 $1'],
        [/^Reach (.*) Mana$/, '达到 $1 魔力'],
        [/^Reach: (.+) 子午线$/, '需要：$1 条子午线'],
        [/^Abyss runs completed:$/, '深渊通关次数：'],
        [/^Highest depth completed:$/, '最高完成深度：'],
        [/^Message tickers seen:$/, '已见新闻条数：'],
        [/^Unique message tickers seen:$/, '已见不同新闻：'],
        [/^Time this Abyss run:$/, '本次深渊用时：'],
        [/^Total mana produced:$/, '累计魔力产量：'],
        [/^Total time played:$/, '累计游戏时长：'],
        [/^Game time played:$/, '游戏时长：'],
        [/^Mana Maximum: (.+)$/, '魔力上限：$1'],
        [/^Rank ([A-Z])$/, '阶位 $1'],
        [/^Clock: (.+), day (.+)$/, '时钟：$1，第 $2 天'],
        [/^You have ([\d.,]+) coins\.$/, '你有 $1 金币。'],
        [/^You have ([\d.,]+) condensed mana\.$/, '你有 $1 凝结魔力。'],
        [/^奖励：([\d.,]+) coins$/, '奖励：$1 金币'],
        [/^奖励：Mana is increased based on time played \(Currently: (.+)\)$/, '奖励：魔力随游戏时长提升（当前：×$1）'],
        [/^([\d.,]+) coins$/, '$1 金币'],
        [/^([\d.,]+) damage$/, '$1 伤害'],
        [/^(\d+) \/ (\d+) HP$/, '$1 / $2 生命值'],
        [/^(\d+) shield$/, '$1 护盾'],
        [/^\(([\d.,]+) OoM\)$/, '（$1 数量级）'],
        [/^\(×([\d.]+) per meditate\)$/, '（每次冥想 ×$1）'],
        [/^([\d]+) ms per tick$/, '$1 毫秒/次更新'],
        [/^([\d]+) ms between display updates$/, '显示刷新间隔 $1 毫秒'],
        [/^100 quindecillion mana is a lot$/, '一百万亿亿魔力可真不少'],
        [/^wordle in 7$/, '七次猜词'],
        [/^([\s\S]*?) mana$/, '$1 魔力'],
        [/^Mana is increased based on time played \(Currently: (.+)\)$/, '魔力随游戏时长提升（当前：×$1）']
    ];

    var ALIASES = {
        'Save copied to clipboard.': '存档已复制到剪贴板。',
        'Copy your save:': '复制你的存档：',
        'Paste your save:': '粘贴你的存档：',
        'Save imported successfully.': '存档导入成功。',
        'Invalid save data.': '存档数据无效。',
        'Paste a Remembrance tree export': '粘贴追忆树导出内容',
        'Unrecognized Mana Paradox save format': '无法识别的魔力悖论存档格式',
        'Save data is corrupted': '存档数据已损坏',
        'Save data is from a newer version': '存档来自更新版本',
        'How to Play': '新手指南',
        'Search topics…': '搜索主题…',
        'Frames per second': '每秒帧数',
        'Export Save': '导出存档',
        'Import Save': '导入存档',
        'Reset Game': '重置游戏',
        'Sonic Value:': '声能值：',
        'Enter the Abyss': '进入深渊',
        'Current Mana Circle': '当前魔力圈',
        'Select an auto-caster to view them.': '选择一个自动施法者以查看详情。',
        'Basic': '基础',
        'Board': '公会面板',
        'Rank F': '阶位 F',
        'i am very original': '我超有原创性的',
        'This will permanently reset your game.': '这将永久重置你的游戏进度。',
        'Are you sure?': '确定吗？'
    };

    function hasChinese(s) { return /[\u3400-\u9fff]/.test(s); }

    function applyRule(text) {
        for (var i = 0; i < RULES.length; i++) {
            var rule = RULES[i];
            var m = text.match(rule[0]);
            if (!m) continue;
            stats.rules++;
            return typeof rule[1] === 'function' ? rule[1](m) : text.replace(rule[0], rule[1]);
        }
        return text;
    }

    function translateLine(text) {
        if (typeof text !== 'string' || !text.length) return text;
        var match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
        var before = match ? match[1] : '';
        var core = match ? match[2] : text;
        var after = match ? match[3] : '';
        if (!core.length) return text;
        var ruled = applyRule(core);
        if (ruled !== core) return before + ruled + after;
        if (hasChinese(core)) return text;
        if (Object.prototype.hasOwnProperty.call(ALIASES, core)) return before + ALIASES[core] + after;
        return text;
    }

    function translate(text) {
        if (isEnglish()) return text; // English mode: fully transparent.
        if (typeof text !== 'string' || text.indexOf('\n') < 0) return translateLine(text);
        return text.split('\n').map(translateLine).join('\n');
    }

    // ---- DOM layer -----------------------------------------------------------
    var ATTRS = ['title', 'aria-label', 'placeholder', 'alt', 'data-tooltip', 'aria-valuetext'];
    var textState = new WeakMap();
    var attrState = new WeakMap();

    function handleText(node) {
        if (isEnglish()) return;
        var value = node.nodeValue;
        if (!value || !/[A-Za-z]{2}/.test(value)) return;
        var state = textState.get(node);
        if (state && state.translated === value) return;
        var out = translate(value);
        if (out !== value) {
            node.nodeValue = out;
            stats.textNodes++;
        }
        textState.set(node, { source: value, translated: out });
    }

    function handleAttrs(el) {
        if (isEnglish()) return;
        if (el.nodeType !== 1) return;
        var state = attrState.get(el);
        if (!state) { state = Object.create(null); attrState.set(el, state); }
        for (var i = 0; i < ATTRS.length; i++) {
            var attr = ATTRS[i];
            if (!el.hasAttribute || !el.hasAttribute(attr)) continue;
            var value = el.getAttribute(attr);
            if (!value || !/[A-Za-z]{2}/.test(value)) continue;
            var previous = state[attr];
            if (previous && previous.translated === value) continue;
            var out = translate(value);
            if (out !== value) {
                el.setAttribute(attr, out);
                stats.attributes++;
            }
            state[attr] = { source: value, translated: out };
        }
    }

    // ---- Language switcher (injected into Options > General) -----------------
    function buildLanguageControl() {
        var label = document.createElement('label');
        label.setAttribute('data-mp-lang-control', '1');
        var span = document.createElement('span');
        var strong = document.createElement('strong');
        strong.textContent = __MP_T('Language', '语言');
        var small = document.createElement('small');
        small.textContent = __MP_T('Switch interface language (reloads the page)', '切换界面语言（将重新加载页面）');
        span.appendChild(strong);
        span.appendChild(small);
        var select = document.createElement('select');
        var optZh = document.createElement('option');
        optZh.value = 'zh';
        optZh.textContent = '简体中文';
        var optEn = document.createElement('option');
        optEn.value = 'en';
        optEn.textContent = 'English';
        select.appendChild(optZh);
        select.appendChild(optEn);
        select.value = lang;
        select.addEventListener('change', function () { setLanguage(this.value); });
        label.appendChild(span);
        label.appendChild(select);
        return label;
    }

    function injectLanguageControl() {
        var lists = document.querySelectorAll('.option-list');
        var target = null;
        for (var i = 0; i < lists.length; i++) {
            var sec = lists[i].parentElement;
            var h = sec && sec.querySelector('.section-title h1');
            var t = h ? h.textContent : '';
            if (/General|通用|常规/.test(t)) { target = lists[i]; break; }
        }
        var existing = document.querySelector('[data-mp-lang-control]');
        if (!target) {
            // Not on the General panel: drop any control injected on another panel.
            if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
            return;
        }
        if (existing) {
            if (existing.parentElement === target) return; // already in the right place
            if (existing.parentElement) existing.parentElement.removeChild(existing);
        }
        target.appendChild(buildLanguageControl());
    }

    function setLanguage(next) {
        if (next !== 'zh' && next !== 'en') return;
        try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
        try { sessionStorage.setItem('mp-return-options', '1'); } catch (e) {}
        stats.language = next;
        location.reload();
    }

    function maybeReturnToOptions() {
        var flag = false;
        try {
            flag = sessionStorage.getItem('mp-return-options') === '1';
            sessionStorage.removeItem('mp-return-options');
        } catch (e) {}
        if (!flag) return;
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var nodes = document.querySelectorAll('button, [role="tab"], a, [role="button"]');
            for (var i = 0; i < nodes.length; i++) {
                var t = (nodes[i].textContent || '').trim();
                var target = __MP_T('Options', '选项');
                if (t.indexOf(target) >= 0 || t.indexOf('选项') >= 0 || t.indexOf('Options') >= 0) {
                    var r = nodes[i].getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        nodes[i].click();
                        clearInterval(timer);
                        // Land on the General subtab where the control lives.
                        setTimeout(function () {
                            var subs = document.querySelectorAll('button, [role="tab"]');
                            for (var k = 0; k < subs.length; k++) {
                                var st = (subs[k].textContent || '').trim();
                                if (/^(通用|General)$/.test(st)) { subs[k].click(); break; }
                            }
                        }, 250);
                        return;
                    }
                }
            }
            if (tries > 40) clearInterval(timer);
        }, 150);
    }

    function scan(node) {
        if (!node) return;
        injectLanguageControl();
        if (isEnglish()) return;
        if (node.nodeType === 3) { handleText(node); return; }
        if (node.nodeType !== 1) return;
        handleAttrs(node);
        var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
        var current = walker.currentNode;
        while (current) {
            if (current.nodeType === 3) handleText(current);
            else handleAttrs(current);
            current = walker.nextNode();
        }
    }

    function initialScan() {
        if (isEnglish()) {
            document.documentElement.lang = 'en';
        } else {
            document.documentElement.lang = 'zh-CN';
            document.title = '魔力悖论';
        }
        scan(document.body || document.documentElement);
    }

    var observer = new MutationObserver(function (mutations) {
        injectLanguageControl();
        if (isEnglish()) return;
        for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'childList') {
                for (var j = 0; j < m.addedNodes.length; j++) scan(m.addedNodes[j]);
            } else if (m.type === 'characterData') {
                handleText(m.target);
            } else if (m.type === 'attributes') {
                handleAttrs(m.target);
            }
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialScan);
    else initialScan();
    setTimeout(initialScan, 250);
    setTimeout(maybeReturnToOptions, 400);

    // ---- Native browser dialogs ---------------------------------------------
    var nativeAlert = window.alert.bind(window);
    var nativeConfirm = window.confirm.bind(window);
    var nativePrompt = window.prompt.bind(window);
    window.alert = function (message) { stats.dialogs++; return nativeAlert(translate(String(message))); };
    window.confirm = function (message) { stats.dialogs++; return nativeConfirm(translate(String(message))); };
    window.prompt = function (message, defaultValue) {
        stats.dialogs++;
        return nativePrompt(translate(String(message)), defaultValue);
    };

    // Introspection hook for automated checks.
    window.__i18n = {
        translate: translate,
        stats: stats,
        rescan: initialScan,
        stop: function () { observer.disconnect(); },
        setLanguage: setLanguage,
        language: function () { return lang; },
        pick: __MP_T
    };
})();
