const CONDITIONAL = /\{\{\?(\w+)\}\}([\s\S]*?)\{\{\/\}\}/g;
const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;

type RenderProps = { template: string; values: Record<string, string> };

/* Two symmetric checks, because both directions of drift are silent otherwise:
   a token with no value would leave "{{ foo }}" on the page, and a value no
   token consumes means a figure was computed and then quietly dropped. */
export const renderTemplate = ({ template, values }: RenderProps) => {
  const consumed = new Set<string>();

  /* Comments carry the authoring notes and the block markers, including literal
     token syntax in the examples — none of it is substitutable, and none of it
     belongs in the rendered page. */
  const copy = template.replace(/^<!--[\s\S]*?-->\n?/gm, "");

  const withBranches = copy.replace(
    CONDITIONAL,
    (_match, name: string, body: string) => {
      consumed.add(name);
      const keep = (values[name] ?? "") !== "";
      /* Tokens inside a dropped branch are still accounted for — the branch was
         not taken, which is not the same as the value going missing. */
      if (!keep) {
        for (const [, token] of body.matchAll(TOKEN)) {
          if (token !== undefined) consumed.add(token);
        }
        return "";
      }
      return body;
    },
  );

  const missing: string[] = [];
  const rendered = withBranches.replace(TOKEN, (match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      missing.push(name);
      return match;
    }
    consumed.add(name);
    return value;
  });

  if (missing.length > 0) {
    throw new Error(
      `template: no value computed for ${[...new Set(missing)].join(", ")}`,
    );
  }

  const unused = Object.keys(values).filter((name) => !consumed.has(name));
  if (unused.length > 0) {
    throw new Error(
      `template: computed but never rendered — ${unused.join(", ")}`,
    );
  }

  return `${rendered.replace(/\n{3,}/g, "\n\n").trim()}\n`;
};
