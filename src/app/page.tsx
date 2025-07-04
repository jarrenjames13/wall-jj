import { WallPost } from '@/components/wall-post'
import { UserInfo } from '@/components/user-info'

export default function Home() {
  return (
    <main className="container mx-auto p-4 w-full">
      <h1 className="text-4xl font-bold mb-8 bg-blue-500 text-white p-4 rounded-t-lg">Wall</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <UserInfo />
        </div>
        <div className="md:col-span-2">
          <WallPost />
        </div>
      </div>
    </main>
  )
}