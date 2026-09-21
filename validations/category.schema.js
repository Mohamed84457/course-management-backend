import z from "zod";

const categoryScema=z.object({
    name:z.string().min(1,"name required").max(255),
    description:z.string().optional(),
});

export default categoryScema;