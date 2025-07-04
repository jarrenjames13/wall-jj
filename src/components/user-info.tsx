import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserInfo() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-64 h-64">
          <AvatarImage src="/profile-image.jpg" alt="James" />
          <AvatarFallback>James</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">James</h2>
        
        <div className="w-full ">
          <h3 className="text-lg font-semibold mb-2 border border-gray-200 bg-gray-100  px-4  rounded-t-lg w-fit">Information</h3>
          <div className="space-y-2">
            <div>
              <h4 className="font-medium">Networks</h4>
              <p className="text-gray-600">Developer</p>
            </div>
            <div>
              <h4 className="font-medium">Current City</h4>
              <p className="text-gray-600">Palos Verdes Estates, CA</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}