import type { Access } from 'payload'

export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { status: { equals: 'published' } }
}

export const authenticatedOnly: Access = ({ req: { user } }) => Boolean(user)

export const adminOnly: Access = ({ req: { user } }) => user?.role === 'admin'

export const editorOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin' || user.role === 'editor'
}

export const adminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.id === id
}
