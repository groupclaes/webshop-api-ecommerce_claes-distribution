export function sha1(s: string) { return require('node:crypto').createHash('sha1').update(s).digest('hex') }
