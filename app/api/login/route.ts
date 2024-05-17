import routes from "@/utils/routes";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    // const res = await axiosHandler.post({
    //     endPoint: apiEndpoints.login,
    //     body: {
    //       email: values.email,
    //       password: values.password,
    //     },
    //   });
//   const token =
//     "reyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJleHAiOjM1MTU5Mzg1OTQsInVzZXJfaWQiOjEsInVzZXJfc2VjcmV0IjoiVUUyNUdERUJHNkpNMjZTRzdPWkdFVDI3In0.OEXmO3utPxRsobv84IGCLw8FNRkJTkZppBPXlwnwbIQ";
//   const expires = new Date(Date.now() + 31536000000);
//   const headers = new Headers({
//     Location: routes.dashboard,
//     "Set-Cookie": `token=${token}; Expires=${expires.toUTCString()}; Path=/; HttpOnly; Secure; SameSite=Strict`,
//   });

//   return new Response(null, { status: 302, headers });
}
