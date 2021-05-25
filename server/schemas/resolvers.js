const { User } = require('../models')

const { AuthenticationError } = require('apollo-server-express')

const { signToken } = require('../utils/auth')

const resolvers = {
    Query: {
        me: async(parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password')
                .populate('bookCount')
                .populate('savedBooks')

            return userData;

            }
            throw new AuthenticationError('not logged in')
        }
    },

    Mutation: {
        
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email })

            if (!user) {
                throw new AuthenticationError('Incorrect credentials')
            }

            const correctPW = await user.isCorrectPassword(password)

            if (!correctPW) {
                throw new AuthenticationError('Incorrect credentials')
            }

            const token = signToken(user)
            return { token, user }
        },

        addUser: async (parent, args) => {
            const user = await User.create(args)
            const token = signToken(user)

            return { token, user }
        },

        saveBook: async (parent, { book }, context) => {
            if (context.user) {

                const addBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: book } },
                    { new: true }
                );
                return addBook

            }

            throw new AuthenticationError('You need to be logged in!');

        },

        removeBook: async (parent, { bookId }, context) => {

            if (context.user) {
                const removeBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                )
    
                return removeBook
            }
            
            throw new AuthenticationError('You need to be logged in!');

        }
    }
}

module.exports = resolvers;
