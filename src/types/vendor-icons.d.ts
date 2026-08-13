// Fallback ambient type declarations for icon libraries whose installed
// versions ship without usable `.d.ts` files: lucide-react@1.28.0 and
// react-icons@5.7.0 both lack their declaration files in node_modules, which
// makes `tsc` fail with TS7016. These declarations type the modules as `any`
// so the build is unblocked (icons are used as JSX components — no prop typing
// is lost that matters). Remove this file once the upstream packages provide
// their own type declarations.
declare module 'lucide-react';
declare module 'react-icons/*';
