import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AppGateway {
    @WebSocketServer()
    public server: Server;

    @SubscribeMessage("join")
    handleJoin(@MessageBody() data: { conversationId: number | string }, @ConnectedSocket() socket: Socket){
        const room = String(data?.conversationId ?? "");
        if (!room) return;
        socket.join(room);
    }
}