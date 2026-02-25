import re

with open('style_pro.css', 'r') as f:
    css = f.read()

css = re.sub(r':root\s*\{[^}]+\}', '''
:root {
    --bg-color: #0b0f19;
    --board-bg: #1e293b;
    --cell-bg: #1e293b;
    --cell-border: #334155;
    --text-color: #f8fafc;
    --dl-color: #0ea5e9;
    --tl-color: #10b981;
    --dp-color: #f59e0b;
    --tp-color: #f43f5e;
    --star-color: #ffffff;
    --star-bg-color: #8b5cf6;
    --tile-bg: #fde047;
    --tile-text: #0f172a;
    --primary: #8b5cf6;
    --primary-dark: #6d28d9;
    --glass: rgba(15, 23, 42, 0.75);
    --glass-border: rgba(255, 255, 255, 0.08);
}
''', css, count=1)

css = css.replace('''body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
    color: var(--text-color);
    display: flex;
    justify-content: center;
    min-height: 100vh;
    overflow-x: hidden;
}''', '''body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #020617;
    color: var(--text-color);
    display: flex;
    justify-content: center;
    min-height: 100vh;
    overflow-x: hidden;
}
body::before {
    content: '';
    position: fixed;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.15), transparent 40%);
    z-index: -1;
    animation: drift 20s infinite alternate linear;
}
@keyframes drift { 100% { transform: translate(3%, 3%); } }
''')

css = css.replace('''background: rgba(255, 255, 255, 0.4);''', '''background: rgba(15, 23, 42, 0.6);''')
css = css.replace('''border: 1px solid rgba(255, 255, 255, 0.6);''', '''border: 1px solid var(--glass-border);''')

css = css.replace('''background: linear-gradient(135deg, #0f172a 0%, #334155 100%);''', '''background: linear-gradient(135deg, #38bdf8 0%, #a855f7 100%); filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.4));''')

css = css.replace('''border: 1px solid rgba(255, 255, 255, 0.8);''', '''border: 1px solid var(--glass-border);''')
css = css.replace('''color: #334155;''', '''color: #cbd5e1;''')
css = css.replace('''color: #475569;''', '''color: #94a3b8;''')

css = css.replace('''background: #ffffff;''', '''background: #1e293b;''')
css = css.replace('''background: #f8fafc;''', '''background: #0f172a;''')
css = css.replace('''background: #f8f9fa;''', '''background: #1e293b;''')
css = css.replace('''color: #3c4043;''', '''color: #f8fafc;''')
css = css.replace('''color: #0f172a;''', '''color: #f8fafc;''')


css = css.replace('''background: #ecfeff;''', '''background: rgba(14, 165, 233, 0.2);''')
css = css.replace('''color: var(--primary-dark);''', '''color: #38bdf8;''')
css = css.replace('''#1e293b''', '''#f8fafc''')

with open('style_pro.css', 'w') as f:
    f.write(css)
