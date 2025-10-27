import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";


@WebSocketGateway(8001, { cors: true })
export class AppGateway {
    @SubscribeMessage("message")
    sendMessage(@MessageBody() data, @ConnectedSocket() socket: Socket){
        console.log(data)
        socket.emit('chat', "Salut j'ai bien reçu ton message")
    }
}