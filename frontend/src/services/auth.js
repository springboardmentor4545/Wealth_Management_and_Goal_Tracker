export const getUser = () => {
  return JSON.parse(localStorage.getItem("user"))
}

export const setUser = (data) => {
  localStorage.setItem("user", JSON.stringify(data))
}

export const logout = () => {
  localStorage.removeItem("user")
}
