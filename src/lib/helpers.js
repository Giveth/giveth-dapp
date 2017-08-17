export const isOwner = (address, currentUser) => {
  // console.log('a/c', address, currentUser)
  // console.log(address !== undefined)
  // console.log(currentUser !== undefined)

  return address !== undefined && currentUser !== undefined && address === currentUser
}

