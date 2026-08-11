import node from "@pascca/config/eslint/node";

// @pascca/web is a devDependency of this package for exactly one reason: prisma/seed/*.ts
// imports its content fixtures so the website and the seed never diverge (research R7, T006).
// It must never be imported from the served runtime — apps/api/src stays zero-coupled to
// apps/web (Constitution Check gate 4).
export default [
  ...node,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@pascca/web", "@pascca/web/*"],
              message:
                "@pascca/web may only be imported from prisma/seed/*.ts (research R7). The served API stays zero-coupled to the website.",
            },
          ],
        },
      ],
    },
  },
];
