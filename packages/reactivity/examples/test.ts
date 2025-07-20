interface Link {
  sub: any
  dep: any
  nextDep: Link | undefined
  prevSub: Link | undefined
  nextSub: Link | undefined
}
const link2: Link = {
  sub: 3,
  dep: 4,
  nextDep: undefined,
  prevSub: undefined,
  nextSub: undefined,
}
const link1: Link = {
  sub: 1,
  dep: 2,
  nextDep: link2,
  prevSub: undefined,
  nextSub: undefined,
}
const fn = link => {
  const { nextDep } = link

  link.dep = link.sub = undefined

  link.nextDep = undefined

  link = nextDep
  return link
}
console.log(fn(link1))
