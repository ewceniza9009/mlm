import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Ticket from '../models/Ticket';
import mongoose from 'mongoose';
import { createNotification } from './notificationController';

// Create a new ticket
export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { subject, message } = req.body;

        const ticket = await Ticket.create({
            userId,
            subject,
            messages: [{
                sender: 'user',
                message
            }]
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get my tickets (User)
export const getMyTickets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const tickets = await Ticket.find({ userId }).sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all tickets (Admin)
export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await Ticket.find().populate('userId', 'username email').sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Reply to ticket (User or Admin)
export const replyTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const user = req.user;

        // Determine sender type based on role
        const sender = user.role === 'admin' ? 'admin' : 'user';

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Security check: if user, must own ticket
        if (sender === 'user' && ticket.userId.toString() !== user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        ticket.messages.push({
            sender,
            message,
            date: new Date()
        });

        // If admin replies, maybe set status to resolved? Or keep open. 
        // If user replies, maybe reopen if closed? 
        // For now, just update timestamp via save

        await ticket.save();

        // Notify Recipient
        if (sender === 'admin') {
            // Notify User
            await createNotification(
                ticket.userId.toString(),
                'info',
                'Support Ticket Reply',
                `Admin replied to ticket: ${ticket.subject}`
            );
        } else {
            // Notify Admins? (Optional - ideally we would have an admin notification system)
            // For now, let's keep it user-centric as per request.
        }

        res.json(ticket);
    } catch (error) {
        console.error('Reply Ticket Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Resolve/Close ticket (Admin)
export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body; // 'CLOSED' or 'RESOLVED' or 'OPEN'

        const ticket = await Ticket.findByIdAndUpdate(
            ticketId,
            { status },
            { new: true }
        );
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
